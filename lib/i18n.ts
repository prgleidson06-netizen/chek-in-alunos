export type Language = 'pt' | 'en' | 'es' | 'fr'

export const translations = {
  pt: {
    // Header
    adminLogin: 'Login Admin',
    logout: 'Sair',
    checkIn: 'CHECK-IN',
    students: 'ALUNOS',
    enrollment: 'MATRÍCULA',
    admin: 'ADMIN',
    
    // Search Section
    studentCheckIn: 'CHECK-IN DO ALUNO',
    searchPlaceholder: 'Pesquisar por nome ou ID do aluno...',
    idKeypad: 'Teclado ID',
    search: 'Buscar',
    
    // Student Cards
    recentArrivals: 'Chegadas Recentes',
    checkedIn: 'Check-in',
    belt: 'Faixa',
    stripes: 'graus',
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    annual: 'Anual',
    trial: 'Teste',
    classesToday: 'aulas hoje',
    
    // Info Bar
    currentClass: 'Aula Atual',
    noClassScheduled: 'Nenhuma aula agendada',
    gymCapacity: 'Capacidade',
    announcements: 'Avisos',
    noAnnouncements: 'Sem avisos no momento',
    
    // Admin Panel
    adminPanel: 'Painel Administrativo',
    manageStudents: 'Gerenciar Alunos',
    manageClasses: 'Gerenciar Aulas',
    settings: 'Configurações',
    reports: 'Relatórios',
    
    // Student Registration
    newEnrollment: 'Nova Matrícula',
    personalInfo: 'Informações Pessoais',
    firstName: 'Nome',
    lastName: 'Sobrenome',
    dateOfBirth: 'Data de Nascimento',
    email: 'E-mail',
    phone: 'Telefone',
    address: 'Endereço',
    city: 'Cidade',
    state: 'Estado/Província',
    zipCode: 'CEP',
    country: 'País',
    
    // Emergency Contact
    emergencyContact: 'Contato de Emergência',
    emergencyName: 'Nome do Contato',
    emergencyPhone: 'Telefone de Emergência',
    relationship: 'Parentesco',
    
    // Medical Info
    medicalInfo: 'Informações Médicas',
    allergies: 'Alergias',
    medicalConditions: 'Condições Médicas',
    medications: 'Medicamentos',
    
    // Photo
    studentPhoto: 'Foto do Aluno',
    takePhoto: 'Tirar Foto',
    retakePhoto: 'Tirar Novamente',
    uploadPhoto: 'Enviar Foto',
    startingCamera: 'Iniciando câmera...',
    takeOrUploadPhoto: 'Tire uma foto ou envie uma imagem',
    cameraNotSupported: 'Câmera não suportada neste navegador',
    cameraPermissionDenied: 'Permissão de câmera negada. Por favor, permita acesso à câmera nas configurações do seu navegador.',
    cameraNotFound: 'Nenhuma câmera encontrada neste dispositivo.',
    cameraError: 'Não foi possível acessar a câmera',
    cameraPermissionHint: 'O acesso à câmera foi negado. Habilite nas configurações do navegador ou envie uma foto.',
    
    // Membership
    membershipType: 'Tipo de Plano',
    beltRank: 'Graduação',
    startDate: 'Data de Início',
    
    // Waiver
    waiverTitle: 'Termo de Responsabilidade e Isenção',
    waiverSubtitle: 'Por favor, leia e assine abaixo',
    guardianInfo: 'Informações do Responsável (se menor de 18 anos)',
    guardianName: 'Nome do Responsável',
    guardianRelationship: 'Parentesco',
    guardianPhone: 'Telefone do Responsável',
    signatureRequired: 'Assinatura Obrigatória',
    clearSignature: 'Limpar',
    iAgree: 'Eu li e concordo com os termos acima',
    submitEnrollment: 'Finalizar Matrícula',
    
    // Attendance Card
    attendanceCard: 'Cartão de Frequência',
    totalClasses: 'Total de Aulas',
    printCard: 'Imprimir Cartão',
    
    // Belts
    white: 'Branca',
    blue: 'Azul',
    purple: 'Roxa',
    brown: 'Marrom',
    black: 'Preta',
    
    // Messages
    checkInSuccess: 'Check-in realizado com sucesso!',
    enrollmentSuccess: 'Matrícula realizada com sucesso!',
    errorOccurred: 'Ocorreu um erro. Tente novamente.',
    studentNotFound: 'Aluno não encontrado.',
    pleaseSignWaiver: 'Por favor, assine o termo.',
    pleaseAgreeTerms: 'Por favor, concorde com os termos.',
    photoRequired: 'Foto do aluno é obrigatória.',
    
    // Admin Auth
    adminLoginTitle: 'Login Administrativo',
    password: 'Senha',
    login: 'Entrar',
    invalidPassword: 'Senha incorreta',
    loginButton: 'Entrar',
    invalidCredentials: 'Credenciais inválidas',
    
    // Waiver Text
    waiverText: `TERMO DE RESPONSABILIDADE E ISENÇÃO DE RISCOS

Eu, abaixo assinado, declaro estar ciente e concordo com os seguintes termos:

1. RECONHECIMENTO DE RISCOS
Reconheço que a prática de Jiu-Jitsu Brasileiro envolve riscos inerentes, incluindo, mas não limitado a: lesões físicas, fraturas, entorses, contusões e outras condições médicas.

2. CONDIÇÃO FÍSICA
Declaro que estou em condições físicas adequadas para a prática de artes marciais e que não possuo nenhuma condição médica que me impeça de participar das atividades.

3. ISENÇÃO DE RESPONSABILIDADE
Isento a FJU Artes Marciais, seus instrutores, funcionários e representantes de qualquer responsabilidade por lesões ou danos que possam ocorrer durante a prática.

4. REGRAS E REGULAMENTOS
Concordo em seguir todas as regras e regulamentos da academia, incluindo normas de higiene, respeito aos colegas e instrutores.

5. USO DE IMAGEM
Autorizo o uso de minha imagem para fins promocionais e de divulgação da academia.

6. MENORES DE IDADE
Se o participante for menor de 18 anos, o responsável legal assume todas as responsabilidades descritas neste termo.`,

    // Student List
    studentList: 'Lista de Alunos',
    addStudent: 'Adicionar Aluno',
    editStudent: 'Editar Aluno',
    deleteStudent: 'Excluir Aluno',
    confirmDelete: 'Tem certeza que deseja excluir este aluno?',
    cancel: 'Cancelar',
    save: 'Salvar',
    edit: 'Editar',
    delete: 'Excluir',
    view: 'Ver',
    actions: 'Ações',
    noStudentsFound: 'Nenhum aluno encontrado',
    
    // Class Schedule
    classSchedule: 'Horário das Aulas',
    addClass: 'Adicionar Aula',
    className: 'Nome da Aula',
    instructor: 'Instrutor',
    dayOfWeek: 'Dia da Semana',
    startTime: 'Horário de Início',
    endTime: 'Horário de Término',
    maxCapacity: 'Capacidade Máxima',
    
    // Days of week
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
    sunday: 'Domingo',
  },
  
  en: {
    // Header
    adminLogin: 'Admin Login',
    logout: 'Logout',
    checkIn: 'CHECK-IN',
    students: 'STUDENTS',
    enrollment: 'ENROLLMENT',
    admin: 'ADMIN',
    
    // Search Section
    studentCheckIn: 'STUDENT CHECK-IN',
    searchPlaceholder: 'Search by student name or ID...',
    idKeypad: 'ID Keypad',
    search: 'Search',
    
    // Student Cards
    recentArrivals: 'Recent Arrivals',
    checkedIn: 'Checked In',
    belt: 'Belt',
    stripes: 'stripes',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annual: 'Annual',
    trial: 'Trial',
    classesToday: 'classes today',
    
    // Info Bar
    currentClass: 'Current Class',
    noClassScheduled: 'No class scheduled',
    gymCapacity: 'Capacity',
    announcements: 'Announcements',
    noAnnouncements: 'No announcements at this time',
    
    // Admin Panel
    adminPanel: 'Admin Panel',
    manageStudents: 'Manage Students',
    manageClasses: 'Manage Classes',
    settings: 'Settings',
    reports: 'Reports',
    
    // Student Registration
    newEnrollment: 'New Enrollment',
    personalInfo: 'Personal Information',
    firstName: 'First Name',
    lastName: 'Last Name',
    dateOfBirth: 'Date of Birth',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    state: 'State/Province',
    zipCode: 'ZIP Code',
    country: 'Country',
    
    // Emergency Contact
    emergencyContact: 'Emergency Contact',
    emergencyName: 'Contact Name',
    emergencyPhone: 'Emergency Phone',
    relationship: 'Relationship',
    
    // Medical Info
    medicalInfo: 'Medical Information',
    allergies: 'Allergies',
    medicalConditions: 'Medical Conditions',
    medications: 'Medications',
    
    // Photo
    studentPhoto: 'Student Photo',
    takePhoto: 'Take Photo',
    retakePhoto: 'Retake Photo',
    uploadPhoto: 'Upload Photo',
    startingCamera: 'Starting camera...',
    takeOrUploadPhoto: 'Take a photo or upload an image',
    cameraNotSupported: 'Camera not supported in this browser',
    cameraPermissionDenied: 'Camera permission denied. Please allow camera access in your browser settings.',
    cameraNotFound: 'No camera found on this device.',
    cameraError: 'Could not access camera',
    cameraPermissionHint: 'Camera access was denied. Please enable it in your browser settings or upload a photo instead.',
    
    // Membership
    membershipType: 'Membership Type',
    beltRank: 'Belt Rank',
    startDate: 'Start Date',
    
    // Waiver
    waiverTitle: 'Waiver and Release Agreement',
    waiverSubtitle: 'Please read and sign below',
    guardianInfo: 'Guardian Information (if under 18)',
    guardianName: 'Guardian Name',
    guardianRelationship: 'Relationship',
    guardianPhone: 'Guardian Phone',
    signatureRequired: 'Signature Required',
    clearSignature: 'Clear',
    iAgree: 'I have read and agree to the terms above',
    submitEnrollment: 'Complete Enrollment',
    
    // Attendance Card
    attendanceCard: 'Attendance Card',
    totalClasses: 'Total Classes',
    printCard: 'Print Card',
    
    // Belts
    white: 'White',
    blue: 'Blue',
    purple: 'Purple',
    brown: 'Brown',
    black: 'Black',
    
    // Messages
    checkInSuccess: 'Check-in successful!',
    enrollmentSuccess: 'Enrollment completed successfully!',
    errorOccurred: 'An error occurred. Please try again.',
    studentNotFound: 'Student not found.',
    pleaseSignWaiver: 'Please sign the waiver.',
    pleaseAgreeTerms: 'Please agree to the terms.',
    photoRequired: 'Student photo is required.',
    
    // Admin Auth
    adminLoginTitle: 'Admin Login',
    password: 'Password',
    login: 'Login',
    invalidPassword: 'Invalid password',
    loginButton: 'Login',
    invalidCredentials: 'Invalid credentials',
    
    // Waiver Text
    waiverText: `WAIVER AND RELEASE AGREEMENT

I, the undersigned, acknowledge and agree to the following terms:

1. ACKNOWLEDGMENT OF RISKS
I acknowledge that the practice of Brazilian Jiu-Jitsu involves inherent risks, including but not limited to: physical injuries, fractures, sprains, bruises, and other medical conditions.

2. PHYSICAL CONDITION
I declare that I am in adequate physical condition to practice martial arts and that I do not have any medical condition that would prevent me from participating in the activities.

3. RELEASE OF LIABILITY
I release FJU Martial Arts, its instructors, employees, and representatives from any liability for injuries or damages that may occur during practice.

4. RULES AND REGULATIONS
I agree to follow all rules and regulations of the academy, including hygiene standards, respect for colleagues and instructors.

5. IMAGE RIGHTS
I authorize the use of my image for promotional purposes and academy advertising.

6. MINORS
If the participant is under 18 years of age, the legal guardian assumes all responsibilities described in this agreement.`,

    // Student List
    studentList: 'Student List',
    addStudent: 'Add Student',
    editStudent: 'Edit Student',
    deleteStudent: 'Delete Student',
    confirmDelete: 'Are you sure you want to delete this student?',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    actions: 'Actions',
    noStudentsFound: 'No students found',
    
    // Class Schedule
    classSchedule: 'Class Schedule',
    addClass: 'Add Class',
    className: 'Class Name',
    instructor: 'Instructor',
    dayOfWeek: 'Day of Week',
    startTime: 'Start Time',
    endTime: 'End Time',
    maxCapacity: 'Max Capacity',
    
    // Days of week
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  },
  
  es: {
    // Header
    adminLogin: 'Admin Login',
    logout: 'Salir',
    checkIn: 'CHECK-IN',
    students: 'ALUMNOS',
    enrollment: 'MATRÍCULA',
    admin: 'ADMIN',
    
    // Search Section
    studentCheckIn: 'CHECK-IN DEL ALUMNO',
    searchPlaceholder: 'Buscar por nombre o ID del alumno...',
    idKeypad: 'Teclado ID',
    search: 'Buscar',
    
    // Student Cards
    recentArrivals: 'Llegadas Recientes',
    checkedIn: 'Registrado',
    belt: 'Cinturón',
    stripes: 'grados',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    annual: 'Anual',
    trial: 'Prueba',
    classesToday: 'clases hoy',
    
    // Info Bar
    currentClass: 'Clase Actual',
    noClassScheduled: 'Sin clase programada',
    gymCapacity: 'Capacidad',
    announcements: 'Anuncios',
    noAnnouncements: 'Sin anuncios en este momento',
    
    // Admin Panel
    adminPanel: 'Panel de Administración',
    manageStudents: 'Gestionar Alumnos',
    manageClasses: 'Gestionar Clases',
    settings: 'Configuración',
    reports: 'Informes',
    
    // Student Registration
    newEnrollment: 'Nueva Matrícula',
    personalInfo: 'Información Personal',
    firstName: 'Nombre',
    lastName: 'Apellido',
    dateOfBirth: 'Fecha de Nacimiento',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    address: 'Dirección',
    city: 'Ciudad',
    state: 'Estado/Provincia',
    zipCode: 'Código Postal',
    country: 'País',
    
    // Emergency Contact
    emergencyContact: 'Contacto de Emergencia',
    emergencyName: 'Nombre del Contacto',
    emergencyPhone: 'Teléfono de Emergencia',
    relationship: 'Parentesco',
    
    // Medical Info
    medicalInfo: 'Información Médica',
    allergies: 'Alergias',
    medicalConditions: 'Condiciones Médicas',
    medications: 'Medicamentos',
    
    // Photo
    studentPhoto: 'Foto del Alumno',
    takePhoto: 'Tomar Foto',
    retakePhoto: 'Tomar de Nuevo',
    uploadPhoto: 'Subir Foto',
    startingCamera: 'Iniciando cámara...',
    takeOrUploadPhoto: 'Tome una foto o suba una imagen',
    cameraNotSupported: 'Cámara no soportada en este navegador',
    cameraPermissionDenied: 'Permiso de cámara denegado. Por favor, permita el acceso a la cámara en la configuración de su navegador.',
    cameraNotFound: 'No se encontró cámara en este dispositivo.',
    cameraError: 'No se pudo acceder a la cámara',
    cameraPermissionHint: 'El acceso a la cámara fue denegado. Habilítelo en la configuración del navegador o suba una foto.',
    
    // Membership
    membershipType: 'Tipo de Plan',
    beltRank: 'Graduación',
    startDate: 'Fecha de Inicio',
    
    // Waiver
    waiverTitle: 'Exención de Responsabilidad',
    waiverSubtitle: 'Por favor, lea y firme abajo',
    guardianInfo: 'Información del Responsable (si es menor de 18 años)',
    guardianName: 'Nombre del Responsable',
    guardianRelationship: 'Parentesco',
    guardianPhone: 'Teléfono del Responsable',
    signatureRequired: 'Firma Obligatoria',
    clearSignature: 'Limpiar',
    iAgree: 'He leído y acepto los términos anteriores',
    submitEnrollment: 'Completar Matrícula',
    
    // Attendance Card
    attendanceCard: 'Tarjeta de Asistencia',
    totalClasses: 'Total de Clases',
    printCard: 'Imprimir Tarjeta',
    
    // Belts
    white: 'Blanco',
    blue: 'Azul',
    purple: 'Morado',
    brown: 'Marrón',
    black: 'Negro',
    
    // Messages
    checkInSuccess: '¡Check-in realizado con éxito!',
    enrollmentSuccess: '¡Matrícula completada con éxito!',
    errorOccurred: 'Ocurrió un error. Por favor, intente de nuevo.',
    studentNotFound: 'Alumno no encontrado.',
    pleaseSignWaiver: 'Por favor, firme la exención.',
    pleaseAgreeTerms: 'Por favor, acepte los términos.',
    photoRequired: 'La foto del alumno es obligatoria.',
    
    // Admin Auth
    adminLoginTitle: 'Acceso Administrativo',
    password: 'Contraseña',
    login: 'Iniciar Sesión',
    invalidPassword: 'Contraseña incorrecta',
    loginButton: 'Entrar',
    invalidCredentials: 'Credenciales inválidas',
    
    // Waiver Text
    waiverText: `EXENCIÓN DE RESPONSABILIDAD Y LIBERACIÓN DE RIESGOS

Yo, el abajo firmante, reconozco y acepto los siguientes términos:

1. RECONOCIMIENTO DE RIESGOS
Reconozco que la práctica de Jiu-Jitsu Brasileño implica riesgos inherentes, incluyendo pero no limitado a: lesiones físicas, fracturas, esguinces, contusiones y otras condiciones médicas.

2. CONDICIÓN FÍSICA
Declaro que estoy en condiciones físicas adecuadas para practicar artes marciales y que no tengo ninguna condición médica que me impida participar en las actividades.

3. LIBERACIÓN DE RESPONSABILIDAD
Libero a FJU Artes Marciales, sus instructores, empleados y representantes de cualquier responsabilidad por lesiones o daños que puedan ocurrir durante la práctica.

4. REGLAS Y REGLAMENTOS
Acepto seguir todas las reglas y reglamentos de la academia, incluyendo normas de higiene, respeto a los compañeros e instructores.

5. DERECHOS DE IMAGEN
Autorizo el uso de mi imagen con fines promocionales y de publicidad de la academia.

6. MENORES DE EDAD
Si el participante es menor de 18 años, el tutor legal asume todas las responsabilidades descritas en este acuerdo.`,

    // Student List
    studentList: 'Lista de Alumnos',
    addStudent: 'Agregar Alumno',
    editStudent: 'Editar Alumno',
    deleteStudent: 'Eliminar Alumno',
    confirmDelete: '¿Está seguro de que desea eliminar este alumno?',
    cancel: 'Cancelar',
    save: 'Guardar',
    edit: 'Editar',
    delete: 'Eliminar',
    view: 'Ver',
    actions: 'Acciones',
    noStudentsFound: 'No se encontraron alumnos',
    
    // Class Schedule
    classSchedule: 'Horario de Clases',
    addClass: 'Agregar Clase',
    className: 'Nombre de la Clase',
    instructor: 'Instructor',
    dayOfWeek: 'Día de la Semana',
    startTime: 'Hora de Inicio',
    endTime: 'Hora de Fin',
    maxCapacity: 'Capacidad Máxima',
    
    // Days of week
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  },
  
  fr: {
    // Header
    adminLogin: 'Connexion Admin',
    logout: 'Déconnexion',
    checkIn: 'CHECK-IN',
    students: 'ÉLÈVES',
    enrollment: 'INSCRIPTION',
    admin: 'ADMIN',
    
    // Search Section
    studentCheckIn: "CHECK-IN DE L'ÉLÈVE",
    searchPlaceholder: "Rechercher par nom ou ID de l'élève...",
    idKeypad: 'Clavier ID',
    search: 'Rechercher',
    
    // Student Cards
    recentArrivals: 'Arrivées Récentes',
    checkedIn: 'Enregistré',
    belt: 'Ceinture',
    stripes: 'degrés',
    monthly: 'Mensuel',
    quarterly: 'Trimestriel',
    annual: 'Annuel',
    trial: 'Essai',
    classesToday: "cours aujourd'hui",
    
    // Info Bar
    currentClass: 'Cours Actuel',
    noClassScheduled: 'Aucun cours programmé',
    gymCapacity: 'Capacité',
    announcements: 'Annonces',
    noAnnouncements: "Aucune annonce pour le moment",
    
    // Admin Panel
    adminPanel: "Panneau d'Administration",
    manageStudents: 'Gérer les Élèves',
    manageClasses: 'Gérer les Cours',
    settings: 'Paramètres',
    reports: 'Rapports',
    
    // Student Registration
    newEnrollment: 'Nouvelle Inscription',
    personalInfo: 'Informations Personnelles',
    firstName: 'Prénom',
    lastName: 'Nom',
    dateOfBirth: 'Date de Naissance',
    email: 'E-mail',
    phone: 'Téléphone',
    address: 'Adresse',
    city: 'Ville',
    state: 'État/Province',
    zipCode: 'Code Postal',
    country: 'Pays',
    
    // Emergency Contact
    emergencyContact: "Contact d'Urgence",
    emergencyName: 'Nom du Contact',
    emergencyPhone: "Téléphone d'Urgence",
    relationship: 'Lien de Parenté',
    
    // Medical Info
    medicalInfo: 'Informations Médicales',
    allergies: 'Allergies',
    medicalConditions: 'Conditions Médicales',
    medications: 'Médicaments',
    
    // Photo
    studentPhoto: "Photo de l'Élève",
    takePhoto: 'Prendre Photo',
    retakePhoto: 'Reprendre',
    uploadPhoto: 'Télécharger Photo',
    startingCamera: 'Démarrage de la caméra...',
    takeOrUploadPhoto: 'Prenez une photo ou téléchargez une image',
    cameraNotSupported: 'Caméra non supportée dans ce navigateur',
    cameraPermissionDenied: "Permission de caméra refusée. Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.",
    cameraNotFound: 'Aucune caméra trouvée sur cet appareil.',
    cameraError: "Impossible d'accéder à la caméra",
    cameraPermissionHint: "L'accès à la caméra a été refusé. Activez-le dans les paramètres du navigateur ou téléchargez une photo.",
    
    // Membership
    membershipType: "Type d'Abonnement",
    beltRank: 'Grade',
    startDate: 'Date de Début',
    
    // Waiver
    waiverTitle: 'Décharge de Responsabilité',
    waiverSubtitle: 'Veuillez lire et signer ci-dessous',
    guardianInfo: 'Informations du Tuteur (si moins de 18 ans)',
    guardianName: 'Nom du Tuteur',
    guardianRelationship: 'Lien de Parenté',
    guardianPhone: 'Téléphone du Tuteur',
    signatureRequired: 'Signature Obligatoire',
    clearSignature: 'Effacer',
    iAgree: "J'ai lu et j'accepte les conditions ci-dessus",
    submitEnrollment: "Terminer l'Inscription",
    
    // Attendance Card
    attendanceCard: 'Carte de Présence',
    totalClasses: 'Total des Cours',
    printCard: 'Imprimer la Carte',
    
    // Belts
    white: 'Blanche',
    blue: 'Bleue',
    purple: 'Violette',
    brown: 'Marron',
    black: 'Noire',
    
    // Messages
    checkInSuccess: 'Check-in réussi!',
    enrollmentSuccess: 'Inscription terminée avec succès!',
    errorOccurred: "Une erreur s'est produite. Veuillez réessayer.",
    studentNotFound: 'Élève non trouvé.',
    pleaseSignWaiver: 'Veuillez signer la décharge.',
    pleaseAgreeTerms: 'Veuillez accepter les conditions.',
    photoRequired: "La photo de l'élève est obligatoire.",
    
    // Admin Auth
    adminLoginTitle: 'Connexion Administrative',
    password: 'Mot de passe',
    login: 'Se Connecter',
    invalidPassword: 'Mot de passe incorrect',
    loginButton: 'Connexion',
    invalidCredentials: 'Identifiants invalides',
    
    // Waiver Text
    waiverText: `DÉCHARGE DE RESPONSABILITÉ ET LIBÉRATION DES RISQUES

Je soussigné(e), reconnais et accepte les conditions suivantes:

1. RECONNAISSANCE DES RISQUES
Je reconnais que la pratique du Jiu-Jitsu Brésilien comporte des risques inhérents, y compris mais sans s'y limiter: blessures physiques, fractures, entorses, contusions et autres conditions médicales.

2. CONDITION PHYSIQUE
Je déclare être en condition physique adéquate pour pratiquer les arts martiaux et ne pas avoir de condition médicale m'empêchant de participer aux activités.

3. LIBÉRATION DE RESPONSABILITÉ
Je libère FJU Arts Martiaux, ses instructeurs, employés et représentants de toute responsabilité pour les blessures ou dommages pouvant survenir pendant la pratique.

4. RÈGLES ET RÈGLEMENTS
J'accepte de suivre toutes les règles et règlements de l'académie, y compris les normes d'hygiène, le respect des collègues et instructeurs.

5. DROITS À L'IMAGE
J'autorise l'utilisation de mon image à des fins promotionnelles et de publicité de l'académie.

6. MINEURS
Si le participant a moins de 18 ans, le tuteur légal assume toutes les responsabilités décrites dans cet accord.`,

    // Student List
    studentList: 'Liste des Élèves',
    addStudent: 'Ajouter un Élève',
    editStudent: "Modifier l'Élève",
    deleteStudent: "Supprimer l'Élève",
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet élève?',
    cancel: 'Annuler',
    save: 'Enregistrer',
    edit: 'Modifier',
    delete: 'Supprimer',
    view: 'Voir',
    actions: 'Actions',
    noStudentsFound: 'Aucun élève trouvé',
    
    // Class Schedule
    classSchedule: 'Horaire des Cours',
    addClass: 'Ajouter un Cours',
    className: 'Nom du Cours',
    instructor: 'Instructeur',
    dayOfWeek: 'Jour de la Semaine',
    startTime: 'Heure de Début',
    endTime: 'Heure de Fin',
    maxCapacity: 'Capacité Maximale',
    
    // Days of week
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
  },
} as const

export function getTranslation(lang: Language) {
  return translations[lang]
}

export const languageNames: Record<Language, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
}

export const languageFlags: Record<Language, string> = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
}
