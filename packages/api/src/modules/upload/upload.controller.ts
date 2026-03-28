import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { UploadService, UploadType } from './upload.service';
import { UploadFileInterceptor } from './upload-interceptor.factory';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/** Reusable Swagger schema for file upload body. */
const FILE_UPLOAD_BODY = {
  schema: {
    type: 'object' as const,
    properties: {
      file: { type: 'string' as const, format: 'binary' },
    },
  },
};

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('v1/upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // -----------------------------------------------------------------------
  // Cover upload
  // -----------------------------------------------------------------------

  @Post('cover')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(UploadFileInterceptor('file', UploadType.COVER))
  @ApiOperation({ summary: 'Upload de imagem de capa do curso (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_BODY)
  @ApiResponse({
    status: 201,
    description: 'Imagem de capa enviada com sucesso',
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string', example: '/uploads/covers/uuid.jpg' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Arquivo invalido' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  uploadCover(@UploadedFile() file: Express.Multer.File) {
    this.ensureFilePresent(file);
    this.uploadService.validateFile(file, UploadType.COVER);
    const filePath = this.uploadService.getFilePath(
      UploadType.COVER,
      file.filename,
    );
    return { path: filePath };
  }

  // -----------------------------------------------------------------------
  // Material upload (linked to lesson)
  // -----------------------------------------------------------------------

  @Post('material/:lessonId')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(UploadFileInterceptor('file', UploadType.MATERIAL))
  @ApiOperation({ summary: 'Upload de material para uma aula (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_BODY)
  @ApiResponse({ status: 201, description: 'Material enviado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Arquivo invalido ou aula nao encontrada',
  })
  async uploadMaterial(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.ensureFilePresent(file);
    return this.uploadService.createMaterial(lessonId, file);
  }

  // -----------------------------------------------------------------------
  // Logo upload
  // -----------------------------------------------------------------------

  @Post('logo')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(UploadFileInterceptor('file', UploadType.LOGO))
  @ApiOperation({ summary: 'Upload de logo da plataforma (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_BODY)
  @ApiResponse({
    status: 201,
    description: 'Logo enviado com sucesso',
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string', example: '/uploads/logos/uuid.png' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Arquivo invalido' })
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    this.ensureFilePresent(file);
    this.uploadService.validateFile(file, UploadType.LOGO);
    const filePath = this.uploadService.getFilePath(
      UploadType.LOGO,
      file.filename,
    );
    return { path: filePath };
  }

  // -----------------------------------------------------------------------
  // Material delete
  // -----------------------------------------------------------------------

  @Delete('material/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Excluir material de apoio (admin)' })
  @ApiResponse({ status: 200, description: 'Material excluido com sucesso' })
  @ApiResponse({ status: 404, description: 'Material nao encontrado' })
  async deleteMaterial(@Param('id', ParseIntPipe) id: number) {
    await this.uploadService.deleteMaterial(id);
    return { message: 'Material excluido com sucesso' };
  }

  // -----------------------------------------------------------------------
  // List materials by lesson
  // -----------------------------------------------------------------------

  @Get('material/lesson/:lessonId')
  @ApiOperation({ summary: 'Listar materiais de uma aula' })
  @ApiResponse({ status: 200, description: 'Lista de materiais' })
  async getMaterialsByLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    return this.uploadService.getMaterialsByLesson(lessonId);
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /** Guard against missing file in multipart request. */
  private ensureFilePresent(file: Express.Multer.File | undefined): void {
    if (!file) {
      throw new BadRequestException(
        'Nenhum arquivo enviado. Envie um arquivo no campo "file".',
      );
    }
  }
}
