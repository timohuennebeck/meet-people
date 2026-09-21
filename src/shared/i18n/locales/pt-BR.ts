/**
 * Portuguese (Brazil) — the source locale. Every string is the exact copy from
 * the `Nearby Plans iOS` design export, so screens render identically to the
 * mockups when this locale is active.
 */
export const ptBR = {
  common: {
    continue: 'Continuar',
    save: 'Salvar',
    cancel: 'Cancelar',
    tagCount: '{{used}}/{{max}}',
    skip: 'Pular',
    publish: 'Publicar',
    back: 'Voltar',
    notNow: 'Agora não',
    preferNotToSay: 'Prefiro não dizer',
    done: 'Pronto',
    profile: 'Perfil',
    freeSeat: 'livre',
    you: 'Você',
    stepOf: '{{step}} de {{total}}',
    years: 'anos',
    or: 'ou',
    close: 'Fechar',
    verified: 'Verificado',
    more: 'Mais opções',
    remove: 'Remover {{label}}',
    raiseLower: 'Aumentar o mínimo',
    lowerLower: 'Diminuir o mínimo',
  },

  welcome: {
    titleHighlight: 'Hoje à noite',
    titleRest: 'já tem planos?',
    subtitle: 'Veja o que quem está perto vai fazer hoje.',
    socialProof: '128 planos esta semana em Lisboa',
    rating: '4,8 de 5',
    ratingCount: '· 1.240 avaliações',
    start: 'Começar',
    languagePicker: 'Idioma do app',
    haveAccount: 'Já tem conta?',
    signIn: 'Entrar',
    legalPrefix: 'Ao começar você aceita os',
    terms: 'Termos',
    legalJoin: 'e',
    privacy: 'Privacidade',
    legalSuffix: '.',
    planRunTitle: 'Corrida de 3 mi',
    planRunMeta: 'hoje 18:30',
    planCoffeeTitle: 'Café no domingo',
    planCoffeeMeta: '2 vagas livres',
  },

  onboarding: {
    location: {
      title: 'Onde procuramos\nos planos?',
      subtitle: 'Só o que dá para ir a pé.',
      benefitDistance: 'Ordenamos os planos pela distância até você.',
      benefitPrivacy: 'Ninguém vê seu endereço, só o bairro.',
      allow: 'Permitir localização',
      chooseNeighbourhood: 'Escolher bairro',
      locating: 'Buscando sua localização…',
      unavailable: 'Sem a localização, o mapa não mostra o que está perto de você.',
    },
    radius: {
      title: 'Até onde você\nquer ir?',
      subtitle: 'Mostramos só planos dentro deste raio.',
      from: 'de Lisboa',
      plansInRadius: '14 planos neste raio',
    },
    ageRange: {
      title: 'Que idades\nvocê quer ver?',
      subtitle: 'Dá para mudar depois nas preferências.',
      plansInRange: '9 planos nesta faixa',
      presetAll: 'Todas',
    },
    interests: {
      title: 'O que você\ngosta de fazer?',
      subtitle: 'Escreva e aperte enter.',
      continueWith: 'Continuar com {{count}}',
      suggestionCoffee: 'Café',
      suggestionBreakfast: 'Café da manhã',
    },
    languages: {
      title: 'Que idiomas\nvocê fala?',
      subtitle: 'Aparece no seu perfil.',
      searchAnother: 'Procurar outro idioma',
    },
    country: {
      title: 'De onde\nvocê é?',
      subtitle: 'A bandeira aparece na sua foto de perfil.',
      searchAnother: 'Procurar outro país',
    },
    languageSearch: {
      title: 'Procurar idioma',
      placeholder: 'Buscar idioma',
      noResults: 'Nenhum idioma para “{{query}}”.',
      nearbyCommon: 'COMUNS NO BAIRRO',
    },
    account: {
      title: 'Guarde sua conta.',
      subtitle: 'Seus planos, conversas e o selo ficam salvos em qualquer aparelho.',
      withEmail: 'Com e-mail',
      withGoogle: 'Continuar com o Google',
      legalPrefix: 'Ao criar a conta você aceita os',
      terms: 'Termos de uso',
      legalJoin: 'e a',
      privacy: 'Política de privacidade',
      legalSuffix: '.',
      emailLabel: 'E-MAIL',
      passwordLabel: 'SENHA',
      passwordPlaceholder: 'Mínimo 8 caracteres',
      createAccount: 'Criar conta',
    },
    signUp: {
      title: 'Criar sua conta.',
      subtitle: 'Use um e-mail que você abre sempre. Ele confirma o seu selo.',
      emailPlaceholder: 'voce@email.com',
      togglePassword: 'Mostrar ou ocultar a senha',
      strength: 'Força da senha',
      weak: 'Fraca',
      fair: 'Média',
      good: 'Boa',
      strong: 'Forte',
      haveAccount: 'Já tem conta?',
      signIn: 'Entrar',
      creating: 'Criando sua conta…',
    },
    signIn: {
      title: 'Entrar na sua conta.',
      subtitle: 'Use o e-mail e a senha que você cadastrou.',
      submit: 'Entrar',
      submitting: 'Entrando…',
      noAccount: 'Ainda não tem conta?',
      createAccount: 'Criar conta',
    },
    // What went wrong signing up or signing in, in words the person can act on.
    authError: {
      offline: 'Sem conexão. Verifique sua internet e tente de novo.',
      invalidCredentials: 'E-mail ou senha incorretos. Tente de novo ou crie uma conta.',
      emailTaken: 'Já existe uma conta com esse e-mail. Entre em vez de criar outra.',
      invalidEmail: 'Esse e-mail não parece válido. Confira e tente de novo.',
      weakPassword: 'Senha muito fraca. Use pelo menos 8 caracteres, com um número.',
      tooManyAttempts: 'Tentativas demais. Espere um minuto e tente de novo.',
      unknown: 'Não foi possível concluir agora. Tente de novo em instantes.',
    },
    confirmation: {
      // The name is highlighted, so the sentence is split around it.
      titleLead: 'Tudo pronto,',
      titleTrail: '.',
      // The same sentence for an account that has not been named yet.
      titleSolo: 'Tudo pronto.',
      subtitle: 'Sua conta está segura. Falta pouco para você ver quem tem planos por perto hoje.',
      manageAccount: 'Gerenciar conta',
      pendingTitle: 'Confirme seu e-mail.',
      pendingSubtitle: 'Enviamos um link para o seu e-mail. Abra o link e volte aqui para entrar.',
      pendingContinue: 'Já confirmei — entrar',
    },
    name: {
      title: 'Como você se chama?',
      subtitle: 'Só o primeiro nome.',
      placeholder: 'Seu nome',
    },
    birthday: {
      title: 'Quando é seu\naniversário?',
      subtitle: 'Só a idade aparece.',
      pick: 'Toque para escolher',
      age: '{{age}} anos',
    },
    pronouns: {
      title: 'Seus pronomes',
      subtitle: 'Opcional, aparece ao lado do nome.',
      she: 'ela/dela',
      he: 'ele/dele',
      they: 'elu/delu',
    },
    photo: {
      title: 'Uma foto sua',
      subtitle: 'Com foto você é aceito três vezes mais.',
      takePhoto: 'Tirar foto',
      chooseFromGallery: 'Escolher da galeria',
      addPhoto: 'Adicionar foto',
      changePhoto: 'Trocar foto',
      cameraDenied: 'Libere o acesso à câmera nos ajustes para tirar uma foto.',
      pickFailed: 'Não deu para abrir agora. Tente de novo.',
    },
    phone: {
      title: 'Seu telefone',
      subtitle: 'Um número, um perfil.',
      placeholder: '151 23456789',
      sendCode: 'Enviar código',
    },
    code: {
      title: 'Digite o código',
      sentTo: 'Enviado para {{phone}} ·',
      change: 'Alterar',
      resendIn: 'Novo código em {{time}}',
      confirm: 'Confirmar',
    },
    notifications: {
      title: 'Podemos te\navisar?',
      subtitle: 'Só o que é sobre você.',
      sampleApp: 'TREFF',
      sampleWhen: 'agora',
      sampleTitle: 'Phil aceitou você',
      sampleBody: 'Hoje 19:00, Café Kotti.',
      allow: 'Permitir notificações',
    },
    rules: {
      title: 'Três regras',
      subtitle: 'Confirme uma a uma.',
      counter: '{{index}} de 3',
      agree: 'Concordo',
      confirmAll: 'Confirmar as três',
      allConfirmed: 'Tudo confirmado',
      restart: 'Recomeçar',
      showUpTitle: 'Combinado é combinado',
      showUpBody: 'Avise a tempo se não puder.',
      publicTitle: 'Lugares públicos primeiro',
      publicBody: 'Primeiro encontro com gente por perto.',
      noFlirtTitle: 'Sem cantadas',
      noFlirtBody: 'treff não é app de namoro.',
    },
  },

  verification: {
    intro: {
      eyebrow: 'VERIFICAÇÃO',
      title: 'Duas etapas\naté o selo.',
      subtitle: 'A selfie só nós vemos. Leva menos de um minuto.',
      selfieTitle: 'Selfie',
      selfieBody: 'Centralize o rosto e vire a cabeça devagar.',
      reviewTitle: 'Conferência',
      reviewBody: 'Nós comparamos com sua foto. Você segue usando o app.',
      start: 'Começar',
      skip: 'Seguir sem selo',
    },
    capture: {
      prompt: 'Olhe para a câmera',
      disclaimer: 'Apagamos a selfie depois da conferência.',
      shutter: 'Tirar selfie',
      deniedTitle: 'Precisamos da câmera',
      deniedBody: 'Libere o acesso à câmera nos ajustes para tirar a selfie.',
      openSettings: 'Abrir ajustes',
      noCameraTitle: 'Sem câmera aqui',
      noCameraBody:
        'Não encontramos uma câmera neste aparelho. Você pode seguir sem o selo por enquanto.',
    },
    review: {
      retake: 'Repetir',
      prompt: 'Dá para ver seu rosto com clareza?',
      use: 'Usar esta selfie',
      sending: 'Enviando…',
      failed: 'Não foi possível enviar a selfie. Tente de novo.',
    },
    pending: {
      title: 'Estamos\nconferindo',
      subtitle: 'Normalmente menos de 3 horas.',
      receivedTitle: 'Selfie recebida',
      receivedBody: 'Hoje, 9:41',
      inReviewTitle: 'Em análise',
      inReviewBody: 'Uma pessoa confere o vídeo',
      releasedTitle: 'Selo liberado',
      releasedBody: 'Você recebe um aviso',
      notice: 'Avisamos assim que estiver pronto.',
    },
    success: {
      badgeName: 'Mara',
      badgeMeta: 'Perfil verificado · Lissabon',
      title: 'Você está\nverificado, {{name}}.',
      subtitle:
        'Sua selfie confere com sua foto de perfil. O selo azul já aparece para todo mundo.',
      perkSealed: 'Entra em planos que exigem selo',
      perkHost: 'Pode criar e hospedar planos',
      action: 'Ver planos perto de mim',
    },
  },

  paywall: {
    brand: 'Nearby',
    plus: 'Plus',
    titleLead: 'Peça para entrar em',
    titleHighlight: 'quantos planos',
    titleTrail: 'quiser',
    subtitle: 'Grátis: 3 por semana. Criar planos é sempre ilimitado.',
    perkRequests: 'Pedidos ilimitados',
    perkVisibility: 'Veja quem quer te encontrar',
    perkCity: 'Planos da cidade inteira',
    perkFilters: 'Filtros de idioma, idade e verificados',
    monthly: 'Mensal',
    yearly: 'Anual',
    save: 'Economize 40%',
    perMonth: '/ mês',
    perYear: '/ mês · 71,88 € por ano',
    trial: 'Testar 5 dias grátis',
    trialTerms: 'Depois 5,99 € / mês · cancele quando quiser',
    restore: 'Restaurar compras',
  },

  map: {
    brand: 'treff',
    today: 'Hoje',
    tomorrow: 'Amanhã',
    weekend: 'Fim de semana',
    preview: 'Prévia',
    // Shown where the carousel would be when the chosen day has nothing on.
    empty: {
      today: 'Nada rolando hoje',
      tomorrow: 'Nada marcado para amanhã',
      weekend: 'Nada neste fim de semana',
      body: 'Tente outro dia — ou crie o seu plano e chame quem está por perto.',
    },
  },

  plan: {
    seatsFree_one: '{{count}} vaga livre',
    seatsFree_other: '{{count}} vagas livres',
    seatsLabel: 'VAGAS',
    requestsLabel: 'PEDIDOS',
    requestsCount: 'PEDIDOS · {{count}}',
    waitlistCount: 'LISTA DE ESPERA · {{count}}',
    participating: '{{filled}} de {{total}} participando',
    participatingUncapped_one: '{{count}} participando',
    participatingUncapped_other: '{{count}} participando',
    seatsUnlimited: 'Sem limite',
    hostLine: '{{name}} hospeda ✓',
    standingLine: 'Encontro fixo · sem anfitrião',
    standingTitle: 'Encontro fixo',
    standingDetail: 'Sem anfitrião — quem aparecer, aparece',
    hostTenure: 'Em Berlim desde março · hospeda pela 4ª vez',
    hostRole: 'Host',
    hostBadge: 'VOCÊ É HOST',
    joinedBadge: 'VOCÊ ESTÁ DENTRO',
    askToJoin: 'Pedir para entrar',
    maybeLater: 'Talvez depois',
    withdraw: 'Retirar pedido',
    openGroupChat: 'Ir para o chat do grupo',
    openGroupChatHost: 'Abrir chat do grupo',
    notGoing: 'Não vou mais',
    accept: 'Aceitar',
    swipeToDecline: 'Deslize para a esquerda para recusar',
    addSeat: '+1 vaga',
    waitlistNote: 'Entra se alguém desistir',
    inviteFriends: 'Convidar amigos',
    noRequestsTitle: 'Nenhum pedido ainda',
    noRequestsBody:
      'Seu plano acabou de entrar no mapa. Quem está a até 2 mi vê nas próximas horas.',
    request: {
      title: 'Diga oi para {{name}}',
      subtitle: 'Ele decide quem entra.',
      notePlaceholder: 'Escreva uma mensagem curta.',
      chipBeginner: 'Sou iniciante',
      chipBoard: 'Levo tabuleiro',
      chipArrival: 'Chego 19:15',
      privacyNote: '{{name}} vê seu perfil e sua selfie verificada, não seu endereço.',
      send: 'Enviar pedido',
      sending: 'Enviando…',
    },

    sent: {
      title: 'Pedido enviado',
      body: '{{name}} costuma responder em até uma hora. Você recebe uma notificação.',
      confirmTitle: '{{name}} confirma',
      confirmEstimate: '~1 h',
      confirmBody: 'Assim que ele aceitar, você entra na lista e vê o ponto de encontro.',
    },

    leave: {
      title: 'Não vai mais dar?',
      subtitle: 'Sua vaga volta para o mapa e {{name}} recebe um aviso. Faltam 3 h para começar.',
      messageLabel: 'RECADO PARA O GRUPO · OPCIONAL',
      attendees: 'com {{names}} e você',
      notePlaceholder: 'Desculpa, meu turno mudou. Fica para a próxima.',
      reasonWork: 'Imprevisto no trabalho',
      reasonSick: 'Estou doente',
      warning:
        'Você sai do chat do grupo. Se mudar de ideia, pode pedir para entrar de novo enquanto houver vaga.',
      confirm: 'Sair do plano',
      leaving: 'Saindo…',
      keep: 'Continuo indo',
    },

    attendance: {
      // The text button on the joined sheet once the plan is over.
      open: 'Quem apareceu?',
      navTitle: 'Depois do plano',
      title: 'Quem apareceu?',
      subtitle: '{{plan}} · {{when}}. Desmarque quem faltou.',
      whenToday: 'hoje {{time}}',
      whenYesterday: 'ontem {{time}}',
      whenOn: '{{date}} {{time}}',
      host: 'Anfitrião',
      hostPlans_one: 'Anfitrião · {{count}} plano',
      hostPlans_other: 'Anfitrião · {{count}} planos',
      shared_one: '{{neighbourhood}} · {{count}} plano em comum',
      shared_other: '{{neighbourhood}} · {{count}} planos em comum',
      first: 'primeiro plano juntos',
      warning: 'Uma falta só entra no perfil quando duas pessoas do plano marcam igual.',
      confirm: 'Confirmar',

      thanks: {
        title: 'Obrigado por responder',
        // The two counts are pluralised on their own, then read into the
        // sentence — one key cannot pluralise twice.
        subtitle: 'Marcamos {{present}} e {{absent}}. Ninguém vê quem respondeu o quê.',
        present_one: '{{count}} presença',
        present_other: '{{count}} presenças',
        absent_one: '{{count}} falta',
        absent_other: '{{count}} faltas',
        back: 'Voltar aos planos',
        report: 'Denunciar quem faltou',
      },
    },
  },

  create: {
    what: {
      title: 'Como se chama seu plano?',
      subtitle: 'Uma frase basta.',
      placeholder: 'Tarde de jogos no Café Kotti',
      counter: '{{used}}/{{max}}',
      suggestions: 'SUGESTÕES',
      suggestionAfternoonCoffee: 'Café da tarde',
      suggestionEasyRun: 'Corrida leve',
      suggestionOpenAirCinema: 'Cinema ao ar livre',
      suggestionParkWalk: 'Caminhada no parque',
    },
    where: {
      title: 'Onde vocês se encontram?',
      subtitle: 'Sugestões perto de você.',
      searchPlaceholder: 'Procurar lugar',
      filterNear: 'Perto',
      filterParks: 'Parques',
      recent: 'RECENTES',
      nearYou: 'PERTO DE VOCÊ',
      emptyTitle: 'Nenhum lugar para “{{query}}”',
      emptyBody: 'Tente outro nome ou procure por perto.',
    },
    when: {
      title: 'Quando começa?',
      subtitle: '{{place}} abre até 23:00.',
      inAnHour: 'Em 1 hora',
      todayAt: 'Hoje {{time}}',
      tomorrowAt: 'Amanhã {{time}}',
      exact: 'Hora exata',
      dayLabel: 'Dia',
      timeLabel: 'Horário',
      durationLabel: 'QUANTO TEMPO',
      oneHour: '1 hora',
      twoHours: '2 horas',
      threeHours: '3 horas',
      openEnded: 'Sem hora de fim',
    },
    joinMode: {
      title: 'Como as pessoas\nentram?',
      subtitle: 'Dá para mudar depois.',
      openTitle: 'Entrada livre',
      openBody: 'Sem pedido, primeiro a chegar.',
      approvalTitle: 'Com pedido',
      approvalBody: 'Você aceita cada pessoa.',
      hint: 'Sem aprovação, planos enchem mais rápido.',
    },
    language: {
      title: 'Em que idioma?',
      subtitle: 'Escolha um ou mais. Aparece no card do plano.',
      yours: 'Seu idioma',
      // Both counts are read in as strings: the line never pluralises, and
      // `count` would send i18next looking for `spokenNearby_one`.
      spokenNearby: 'Falado por {{speakers}} de {{total}} por perto',
    },
    seats: {
      title: 'Quem vem junto?',
      subtitle: 'Vagas incluindo você.',
      caption: 'lugares · você e mais {{others}}',
    },
    audience: {
      title: 'Quem pode\nentrar?',
      subtitle: 'Faixa de idade do plano. Opcional.',
      openToAll: 'Aberto a todas as idades',
    },
    published: {
      title: 'Seu plano está\nno mapa',
      subtitle: 'Quem está a até 2 mi já vê.',
      invite: 'Convidar amigos',
      orShare: 'ou compartilhe',
      link: 'Link',
      qr: 'QR',
      more: 'Mais',
    },
  },

  chat: {
    tabTitle: 'Conversas',
    searchPlaceholder: 'Buscar conversa',
    yourPlans: 'SEUS PLANOS',
    unreadCount: '{{count}} novas',
    onlineNow: 'online agora',
    groupMembers: '{{count}} participantes · {{online}} online',
    messagePlaceholder: 'Mensagem',
    groupMessagePlaceholder: 'Mensagem para o grupo',
    attach: 'Anexar',
    removeAttachment: 'Remover anexo',
    attachFailed: 'Não deu para abrir a galeria agora. Tente de novo.',
    send: 'Enviar',
    sent: 'Enviada',
    quickAgreed: 'Combinado',
    quickOnMyWay: 'Estou a caminho',
    quickLate: 'Chego 10 min tarde',
    quickWater: 'Eu levo água',
    quickConfirmed: 'Confirmado',
    quickBike: 'Alguém vem de bike?',
  },

  search: {
    title: 'Buscar pessoas',
    scopePeople: 'Pessoas',
    scopePlans: 'Planos',
    scopePlaces: 'Lugares',
    peopleCount: 'PESSOAS · {{count}}',
    placeholder: 'Buscar pessoas',
    recent: 'BUSCAS RECENTES',
    // The line under a name in the results: neighbourhood, then how many plans
    // the two of you have been on together.
    resultDetail: '{{neighbourhood}} · {{shared}}',
    sharedPlans_one: '{{count}} plano em comum',
    sharedPlans_other: '{{count}} planos em comum',
    noSharedPlans: 'sem planos em comum',
  },

  profile: {
    statPlans: 'planos',
    statShared: 'em comum',
    statAttendance: 'comparece',
    interests: 'INTERESSES',
    invite: 'Convidar para um plano',
    message: 'Mensagem',
    distanceLine: '{{neighbourhood}} · {{distance}} de você',
    tenureLine: 'No app desde março · responde em ~2 h',
    verifiedNote: 'Selfie verificada em março. Perfil confirmado por 3 anfitriões.',

    /**
     * Quem olhou seu perfil. `row` é grátis e conta; `locked*` é o que uma
     * conta grátis vê no lugar da lista, que é do Plus.
     */
    views: {
      row_one: '{{count}} pessoa viu seu perfil esta semana',
      row_other: '{{count}} pessoas viram seu perfil esta semana',
      none: 'Ninguém viu seu perfil esta semana',
      navTitle: 'Quem viu seu perfil',
      lockedCount_one: '{{count}} pessoa viu seu perfil',
      lockedCount_other: '{{count}} pessoas viram seu perfil',
      lockedBody: 'O Plus mostra quem são.',
      lockedAction: 'Conhecer o Plus',
    },
  },

  safety: {
    report: {
      navTitle: 'Denunciar',
      title: 'O que aconteceu?',
      subtitle: '{{name}} não fica sabendo que você denunciou.',
    },

    // Keyed by the `report_reason` enum of docs/database.md §3.1 — the value
    // that goes into `reports.reason`, not the row's position.
    reasons: {
      no_show: {
        title: 'Não apareceu',
        detail: 'Confirmou presença e faltou sem avisar',
      },
      harassment: {
        title: 'Mensagens incômodas',
        detail: 'Insistência, conteúdo sexual ou ofensas',
      },
      fake_profile: {
        title: 'Perfil falso',
        detail: 'Fotos ou informações que não conferem',
      },
      inappropriate: {
        title: 'Comportamento no encontro',
        detail: 'Você se sentiu inseguro ou desconfortável',
      },
      other: {
        title: 'Outro motivo',
        detail: 'Conte com suas palavras',
      },
    },

    detail: {
      navTitle: 'Denunciar · {{reason}}',
      noteLabel: 'O QUE VOCÊ QUER CONTAR · OPCIONAL',
      notePlaceholder: 'Confirmou na véspera e não respondeu no dia.',
      chipNoReply: 'Não respondeu',
      chipSecondTime: 'Já é a 2ª vez',
      warning: 'Analisamos em até 24 h. Em caso de risco imediato, procure a polícia.',
      send: 'Enviar denúncia',
    },

    sent: {
      title: 'Recebemos sua denúncia',
      subtitle:
        'Analisamos em até 24 h e avisamos por aqui. {{name}} foi bloqueada e não vê mais os seus planos.',
      back: 'Voltar aos planos',
      unblock: 'Desbloquear {{name}}',
    },
  },

  settings: {
    title: 'Ajustes',
    groupDiscover: 'DESCOBRIR',
    groupApp: 'APP',
    groupAccount: 'CONTA',
    radius: 'Raio',
    radiusDetail: '14 planos neste raio',
    spokenLanguages: 'Idiomas que eu falo',
    interests: 'Interesses',
    interestsValue: '{{count}} escolhidos',
    appLanguage: 'Idioma do app',
    notifications: 'Avisos',
    notificationsDetail: 'Pedidos e mensagens',
    notificationsValue: 'Ativado',
    accountSecurity: 'Conta e segurança',
    verificationBadge: 'Selo de verificação',
    verified: 'Verificado',
    privacyHelp: 'Privacidade e ajuda',
    leaveReview: 'Avaliar o treff',
    leaveReviewDetail: 'Conte o que está funcionando',
    deleteAccount: 'Excluir conta',
    signOut: 'Sair da conta',

    appLanguagePage: {
      sectionLabel: 'MENUS E AVISOS',
      note: 'Isto muda só o app. Os idiomas que você fala ficam em uma página própria.',
    },
    spokenLanguagesPage: {
      sectionLabel: 'IDIOMAS QUE EU FALO',
    },
    interestsPage: {
      note: 'Escreva e aperte enter. Usamos para ordenar os planos no mapa.',
      suggestions: 'SUGESTÕES',
      suggestionLiveMusic: 'Música ao vivo',
      suggestionMuseums: 'Museus',
    },
    audiencePage: {
      title: 'Quem eu quero ver',
      note: 'Vale para os planos no mapa. Quem hospeda decide o próprio plano.',
      genderLabel: 'GÊNERO',
      ageLabel: 'IDADE',
      everyone: 'Todo mundo',
      women: 'Mulheres',
      men: 'Homens',
      nonBinary: 'Não-binário',
      nonBinaryDetail: 'e outras identidades',
      matchCount: '9 planos com estas preferências',
    },
    deleteAccountPage: {
      title: 'Apagar conta',
      heading: 'Apagar sua conta, {{name}}?',
      subtitle:
        'Some na hora: {{plans}}, {{chats}} e seu selo de verificação. Não dá para desfazer.',
      plansCount_one: '{{count}} plano que você criou',
      plansCount_other: '{{count}} planos que você criou',
      chatsCount_one: '{{count}} conversa',
      chatsCount_other: '{{count}} conversas',
      billing:
        'Sua assinatura Plus é cobrada pela loja do seu celular. Cancele por lá, senão ela continua sendo renovada.',
      confirm: 'Apagar definitivamente',
      keep: 'Manter conta',
    },
    signOutPage: {
      title: 'Sair',
      heading: 'Quer mesmo sair?',
      subtitle:
        'Seus planos, suas conversas e seu selo ficam na sua conta. Da próxima vez que entrar, está tudo lá.',
      confirm: 'Sair',
      stay: 'Continuar conectado',
    },
    reviewPage: {
      heading: 'Você gosta do treff?',
      subtitle: 'Uma avaliação na App Store ajuda outras pessoas a encontrar planos perto delas.',
      starLabel: '{{score}} de 5 estrelas',
      noteLabel: 'SUA AVALIAÇÃO',
      notePlaceholder: 'O que funcionou bem e o que ainda falta.',
      counter: '{{used}} / {{max}}',
      caption: 'O texto e as estrelas vão direto para a App Store.',
      send: 'Enviar avaliação',
      later: 'Agora não',
    },
  },

  // Placeholder prose for the two legal documents, written to read like the
  // real thing. Production text comes from `legal_documents.content_md`.
  legal: {
    updated: 'Atualizado em 20 de setembro de 2026 · versão 1.0',
    understood: 'Entendi',

    terms: {
      title: 'Termos de uso',
      s1Heading: 'Quem pode usar o treff',
      s1Body:
        'É preciso ter pelo menos 18 anos e usar seu nome real. Uma pessoa, uma conta — perfis criados para se passar por outra pessoa são removidos.',
      s2Heading: 'Sua conta',
      s2Body:
        'Você responde pelo que acontece na sua conta e por manter a senha só com você. Avise a gente assim que desconfiar que alguém entrou nela.',
      s3Heading: 'Planos e encontros',
      s3Body:
        'Quem cria um plano escolhe o lugar, o horário e quem entra. Os encontros acontecem em lugares públicos e o treff não organiza nem acompanha nenhum deles.',
      s4Heading: 'Como a gente se trata',
      s4Body:
        'Apareça quando confirmar presença, respeite quem está na mesa e nada de cantadas, assédio ou vender qualquer coisa. Quem passa disso perde o acesso.',
      s5Heading: 'Assinatura',
      s5Body:
        'O plano pago é cobrado pela loja do seu celular e renova sozinho até você cancelar. O cancelamento vale a partir do próximo período.',
      s6Heading: 'O que você publica',
      s6Body:
        'O texto e as fotos dos seus planos continuam seus. Você só nos dá permissão para mostrá-los no app a quem está por perto.',
      s7Heading: 'Encerrar a conta',
      s7Body:
        'Dá para apagar sua conta quando quiser, nas configurações. A gente também pode suspender contas que quebram estas regras ou colocam alguém em risco.',
      s8Heading: 'Mudanças nestes termos',
      s8Body:
        'Quando algo importante mudar, avisamos no app antes de valer. Continuar usando o treff depois disso significa que você aceitou a nova versão.',
    },

    privacy: {
      title: 'Política de privacidade',
      s1Heading: 'O que a gente guarda',
      s1Body:
        'Seu nome, data de nascimento, idiomas, interesses e as fotos que você envia. Sem isso não dá para montar o perfil que aparece nos planos.',
      s2Heading: 'Sua localização',
      s2Body:
        'Usamos sua posição só para ordenar os planos por distância. Ninguém vê seu endereço: as outras pessoas veem o bairro e um raio aproximado.',
      s3Heading: 'A selfie de verificação',
      s3Body:
        'A selfie serve apenas para confirmar que você é uma pessoa real e conferir com sua foto de perfil. Ela não aparece para ninguém e é apagada depois da verificação.',
      s4Heading: 'Com quem compartilhamos',
      s4Body:
        'Só com os serviços que fazem o app funcionar: hospedagem, envio de notificações, pagamentos e métricas de uso. Não vendemos seus dados nem exibimos anúncios.',
      s5Heading: 'Por quanto tempo',
      s5Body:
        'Guardamos seus dados enquanto a conta existir. Depois que você apaga a conta, o perfil sai dos nossos sistemas em até 30 dias, salvo o que a lei manda manter.',
      s6Heading: 'Seus direitos',
      s6Body:
        'Você pode ver, corrigir, exportar ou apagar seus dados quando quiser. É só pedir pelas configurações ou pelo e-mail abaixo.',
      s7Heading: 'Notificações e métricas',
      s7Body:
        'As notificações avisam de pedidos e mensagens; as métricas são anônimas e mostram onde o app trava. Dá para desligar as notificações no aparelho a qualquer momento.',
      s8Heading: 'Fale com a gente',
      s8Body:
        'Dúvidas sobre privacidade? Escreva para privacy@treff.app — respondemos em até 30 dias.',
    },
  },

  /**
   * Dates and times the database does not store. `whenLabel` on a plan and the
   * right-hand column of the conversations list are both built from a timestamp
   * at render time, so they follow the interface language and the calendar day.
   */
  datetime: {
    today: 'Hoje',
    tomorrow: 'Amanhã',
    yesterday: 'Ontem',
    dayAtTime: '{{day}} {{time}}',
    dayFromTo: '{{day}} {{start}}–{{end}}',
  },

  /**
   * The four rules the database enforces by name. Each arrives as a bare word
   * in a Postgres exception; this is what a person reads instead.
   */
  errors: {
    noCredits: 'Você usou seus 3 pedidos desta semana',
    planFull: 'Esse plano acabou de lotar',
    blocked: 'Não dá para entrar nesse plano',
    tooManyInterests: 'Você chegou ao limite de interesses',
    plusRequired: 'Conversar com quem você ainda não encontrou é um recurso do Plus.',
    badTransition: 'Não foi possível fazer isso agora.',
  },

  tabs: {
    explore: 'Explorar',
    chats: 'Conversas',
    profile: 'Perfil',
  },
} as const;

/**
 * Widens the `as const` literals to `string`, recursively. Without this, `en`
 * would have to repeat pt-BR's exact wording to satisfy the type, while the
 * nesting is still checked — a missing or misspelled key stays a compile error.
 */
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export type Translation = Widen<typeof ptBR>;
