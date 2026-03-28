const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function seed() {
  console.log("==> Criando categorias...");
  const cats = await Promise.all([
    prisma.category.upsert({ where: { slug: "marketing-digital" }, update: {}, create: { name: "Marketing Digital", slug: "marketing-digital", order: 2 } }),
    prisma.category.upsert({ where: { slug: "desenvolvimento" }, update: {}, create: { name: "Desenvolvimento", slug: "desenvolvimento", order: 3 } }),
    prisma.category.upsert({ where: { slug: "design" }, update: {}, create: { name: "Design", slug: "design", order: 4 } }),
    prisma.category.upsert({ where: { slug: "negocios" }, update: {}, create: { name: "Negocios", slug: "negocios", order: 5 } }),
    prisma.category.upsert({ where: { slug: "produtividade" }, update: {}, create: { name: "Produtividade", slug: "produtividade", order: 6 } }),
  ]);
  console.log("   " + cats.length + " categorias criadas");

  console.log("==> Criando cursos...");
  const courses = [
    { title: "Marketing Digital do Zero ao Avancado", description: "Aprenda todas as estrategias de marketing digital para alavancar seu negocio online. Do basico ao avancado, cobrindo SEO, redes sociais, email marketing e trafego pago.", salesUrl: "https://hotmart.com/produto/mkt-digital", status: "ACTIVE", order: 1, categoryId: cats[0].id },
    { title: "Trafego Pago - Facebook e Google Ads", description: "Domine as plataformas de anuncios mais poderosas do mundo. Crie campanhas que convertem e escale seu negocio com trafego pago.", salesUrl: "https://hotmart.com/produto/trafego-pago", status: "ACTIVE", order: 2, categoryId: cats[0].id },
    { title: "Desenvolvimento Web Full Stack", description: "Torne-se um desenvolvedor full stack completo. HTML, CSS, JavaScript, React, Node.js, banco de dados e deploy.", salesUrl: "https://hotmart.com/produto/fullstack", status: "ACTIVE", order: 3, categoryId: cats[1].id },
    { title: "Python para Automacao", description: "Automatize tarefas repetitivas com Python. Web scraping, automacao de planilhas, bots e integracao com APIs.", salesUrl: "https://hotmart.com/produto/python", status: "ACTIVE", order: 4, categoryId: cats[1].id },
    { title: "UI/UX Design Profissional", description: "Crie interfaces incriveis que encantam usuarios. Figma, prototipacao, design system e pesquisa de usuario.", salesUrl: "https://hotmart.com/produto/uiux", status: "ACTIVE", order: 5, categoryId: cats[2].id },
    { title: "Canva para Empreendedores", description: "Crie artes profissionais para suas redes sociais, apresentacoes e materiais de marketing usando o Canva.", salesUrl: "https://hotmart.com/produto/canva", status: "ACTIVE", order: 6, categoryId: cats[2].id },
    { title: "Empreendedorismo Digital", description: "Monte seu negocio digital do zero. Validacao de ideia, modelo de negocio, vendas online e escalabilidade.", salesUrl: "https://hotmart.com/produto/empreendedorismo", status: "ACTIVE", order: 7, categoryId: cats[3].id },
    { title: "Produtividade Extrema", description: "Metodos e ferramentas para triplicar sua produtividade. GTD, Pomodoro, Notion, automacoes e habitos de alta performance.", salesUrl: "https://hotmart.com/produto/produtividade", status: "ACTIVE", order: 8, categoryId: cats[4].id },
  ];

  const createdCourses = [];
  for (const c of courses) {
    const course = await prisma.course.create({ data: c });
    createdCourses.push(course);
  }
  console.log("   " + createdCourses.length + " cursos criados");

  console.log("==> Criando modulos e aulas...");
  const youtubeVideos = [
    "dQw4w9WgXcQ", "jNQXAC9IVRw", "9bZkp7q19f0", "kJQP7kiw5Fk",
    "JGwWNGJdvx8", "RgKAFK5djSk", "OPf0YbXqDm0", "fRh_vgS2dFE",
    "YQHsXMglC9A", "hT_nvWreIhg", "CevxZvSJLk8", "09R8_2nJtjg"
  ];
  let videoIdx = 0;
  let totalLessons = 0;

  const moduleNames = {
    1: ["Fundamentos do Marketing", "SEO e Conteudo", "Redes Sociais", "Email Marketing e Automacao"],
    2: ["Fundamentos de Trafego", "Facebook Ads", "Google Ads", "Otimizacao e Escala"],
    3: ["HTML, CSS e JavaScript", "React e Frontend", "Node.js e Backend", "Deploy e DevOps"],
    4: ["Python Basico", "Automacao de Arquivos", "Web Scraping"],
    5: ["Fundamentos de UX", "UI Design no Figma", "Prototipacao e Testes"],
    6: ["Primeiros Passos no Canva", "Templates Profissionais", "Redes Sociais com Canva"],
    7: ["Validacao de Ideias", "Modelo de Negocio", "Vendas e Marketing"],
    8: ["Mentalidade Produtiva", "Ferramentas e Sistemas", "Habitos de Alta Performance"],
  };

  for (const course of createdCourses) {
    const names = moduleNames[course.order] || ["Modulo 1", "Modulo 2", "Modulo 3"];
    for (let m = 0; m < names.length; m++) {
      const mod = await prisma.courseModule.create({
        data: { courseId: course.id, title: names[m], description: "Conteudo completo sobre " + names[m].toLowerCase(), order: m + 1 }
      });

      const lessonCount = course.order <= 3 ? 5 : 4;
      for (let l = 0; l < lessonCount; l++) {
        const vid = youtubeVideos[videoIdx % youtubeVideos.length];
        videoIdx++;
        await prisma.lesson.create({
          data: {
            moduleId: mod.id,
            title: "Aula " + (l + 1) + ": " + names[m] + " - Parte " + (l + 1),
            description: "Nesta aula voce vai aprender os conceitos essenciais de " + names[m].toLowerCase() + ".",
            videoUrl: "https://www.youtube.com/watch?v=" + vid,
            duration: 15 + Math.floor(Math.random() * 30),
            order: l + 1
          }
        });
        totalLessons++;
      }
    }
  }
  console.log("   " + totalLessons + " aulas criadas");

  console.log("==> Criando alunos de exemplo...");
  const hash = await bcrypt.hash("Aluno@123", 10);
  const students = [
    { name: "Maria Silva", email: "maria@exemplo.com" },
    { name: "Joao Santos", email: "joao@exemplo.com" },
    { name: "Ana Oliveira", email: "ana@exemplo.com" },
    { name: "Pedro Costa", email: "pedro@exemplo.com" },
    { name: "Julia Souza", email: "julia@exemplo.com" },
  ];
  const createdStudents = [];
  for (const s of students) {
    const user = await prisma.user.create({ data: { ...s, passwordHash: hash, role: "STUDENT", status: "ACTIVE" } });
    createdStudents.push(user);
  }
  console.log("   " + createdStudents.length + " alunos criados (senha: Aluno@123)");

  console.log("==> Liberando acesso aos cursos...");
  let accessCount = 0;
  // Admin gets all courses
  for (const course of createdCourses) {
    await prisma.courseAccess.create({ data: { userId: 1, courseId: course.id, grantedBy: "ADMIN" } });
    accessCount++;
  }
  // Maria: 4 cursos
  for (let i = 0; i < 4; i++) {
    await prisma.courseAccess.create({ data: { userId: createdStudents[0].id, courseId: createdCourses[i].id, grantedBy: "WEBHOOK" } });
    accessCount++;
  }
  // Joao: 3 cursos
  for (let i = 0; i < 3; i++) {
    await prisma.courseAccess.create({ data: { userId: createdStudents[1].id, courseId: createdCourses[i].id, grantedBy: "WEBHOOK" } });
    accessCount++;
  }
  // Ana: 2 cursos
  for (let i = 0; i < 2; i++) {
    await prisma.courseAccess.create({ data: { userId: createdStudents[2].id, courseId: createdCourses[i].id, grantedBy: "ADMIN" } });
    accessCount++;
  }
  // Pedro: 1 curso
  await prisma.courseAccess.create({ data: { userId: createdStudents[3].id, courseId: createdCourses[0].id, grantedBy: "WEBHOOK" } });
  accessCount++;
  // Julia: 5 cursos
  for (let i = 0; i < 5; i++) {
    await prisma.courseAccess.create({ data: { userId: createdStudents[4].id, courseId: createdCourses[i].id, grantedBy: "WEBHOOK" } });
    accessCount++;
  }
  console.log("   " + accessCount + " acessos liberados");

  console.log("==> Criando progresso de exemplo...");
  let progressCount = 0;
  // Maria progresso no curso 1 (60%)
  const course1Lessons = await prisma.lesson.findMany({
    where: { module: { courseId: createdCourses[0].id } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
  });
  const completedCount = Math.floor(course1Lessons.length * 0.6);
  for (let i = 0; i < completedCount; i++) {
    await prisma.lessonProgress.create({
      data: { userId: createdStudents[0].id, lessonId: course1Lessons[i].id, completed: true, completedAt: new Date(), videoPosition: 0 }
    });
    progressCount++;
  }
  // Maria progresso no curso 2 (30%)
  const course2Lessons = await prisma.lesson.findMany({
    where: { module: { courseId: createdCourses[1].id } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
  });
  const completed2 = Math.floor(course2Lessons.length * 0.3);
  for (let i = 0; i < completed2; i++) {
    await prisma.lessonProgress.create({
      data: { userId: createdStudents[0].id, lessonId: course2Lessons[i].id, completed: true, completedAt: new Date(), videoPosition: 0 }
    });
    progressCount++;
  }
  // Joao completou 100% do curso 1
  for (const lesson of course1Lessons) {
    await prisma.lessonProgress.create({
      data: { userId: createdStudents[1].id, lessonId: lesson.id, completed: true, completedAt: new Date(), videoPosition: 0 }
    });
    progressCount++;
  }
  console.log("   " + progressCount + " registros de progresso criados");

  console.log("==> Criando webhook config de exemplo...");
  await prisma.webhookConfig.create({
    data: { url: "https://hooks.exemplo.com/vendas", events: ["sale.confirmed", "user.registered"], active: true, secret: "wh-secret-123" }
  });

  console.log("");
  console.log("========================================");
  console.log("   SEED COMPLETO!");
  console.log("   6 categorias");
  console.log("   8 cursos");
  console.log("   " + totalLessons + " aulas");
  console.log("   5 alunos + 1 admin");
  console.log("   " + accessCount + " acessos");
  console.log("   " + progressCount + " progressos");
  console.log("========================================");
  console.log("   Login Admin:  admin@hmembers.local / Admin@123");
  console.log("   Login Aluno:  maria@exemplo.com / Aluno@123");
  console.log("========================================");
}

seed().catch(e => console.error(e)).finally(() => prisma.$disconnect());
