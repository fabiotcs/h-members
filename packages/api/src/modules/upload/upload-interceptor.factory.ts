import {
  CallHandler,
  ExecutionContext,
  Injectable,
  mixin,
  NestInterceptor,
  Type,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppConfigService } from '../../config';
import { createMulterStorage } from './multer.config';
import { UploadType } from './upload.service';

/**
 * Creates a NestJS interceptor that configures Multer with the correct
 * disk storage subdirectory for the given UploadType.
 *
 * This factory solves the problem of needing runtime config (UPLOAD_DIR)
 * inside a decorator — decorators are evaluated at class-definition time,
 * but this interceptor resolves the config via DI at request time.
 */
export function UploadFileInterceptor(
  fieldName: string,
  uploadType: UploadType,
): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    private interceptor: NestInterceptor;

    constructor(private readonly appConfig: AppConfigService) {
      const storage = createMulterStorage(
        this.appConfig.storage.uploadDir,
        uploadType,
      );
      const InterceptorClass = FileInterceptor(fieldName, {
        storage,
        limits: { fileSize: this.appConfig.storage.maxUploadSize },
      }) as Type<NestInterceptor>;
      this.interceptor = new InterceptorClass();
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
      const result = this.interceptor.intercept(context, next);
      if (result instanceof Observable) {
        return result;
      }
      return from(result).pipe(switchMap((obs) => obs));
    }
  }

  return mixin(MixinInterceptor);
}
