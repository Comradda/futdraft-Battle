import type { PersonalityType, CrupierMood, GameType } from '../types/casino';

export interface CrupierContext {
  playerScore?: number;
  dealerScore?: number;
  betAmount?: number;
  bankroll?: number;
  handName?: string;
  winningNumber?: number;
  winningColor?: 'red' | 'black' | 'green';
  cardName?: string;
  isHighBet?: boolean;
  isLowBet?: boolean;
  isBluff?: boolean;
  playerName?: string;
  targetScore?: number;
  [key: string]: unknown;
}

export interface CrupierDialogueResult {
  text: string;
  mood: CrupierMood;
  soundPitch: number;
  durationMs?: number;
}

export interface PersonalityConfig {
  id: PersonalityType;
  name: string;
  region: string;
  title: string;
  description: string;
  badge: string;
  avatarMood: CrupierMood;
  glowColor: string;
  basePitch: number;
  image: string;
  gender: 'female' | 'male';
  sampleLine: string;
}

export const PERSONALITY_CONFIGS: Record<PersonalityType, PersonalityConfig> = {
  burlona: {
    id: 'burlona',
    name: 'Valeria',
    region: 'Monterrey, N.L. (Regia)',
    title: 'Regia Provocadora & Burlona',
    description: 'Seductora, picuda y burlona de Nuevo León. Habla golpeadito regio; se burla si juegas pichicato y festeja cuando cobras con madre.',
    badge: '💋 Regia de Monterrey',
    avatarMood: 'smirk',
    glowColor: 'rgba(225, 29, 72, 0.55)',
    basePitch: 520,
    image: '/images/dealers/crupier_burlona.jpg',
    gender: 'female',
    sampleLine: '¡Hombre, qué bárbaro! Tírale con ganas, compadre, aquí en el norte jugamos con billete de a de veras.',
  },
  neutral: {
    id: 'neutral',
    name: 'Sarah',
    region: 'CDMX (Chilanga Fresa)',
    title: 'Chilanga VIP • Polanco Casino',
    description: 'Elegante, cosmopolita y coqueta de la capital. Tono cantadito chilango fino, te habla con clase y mucha coquetería.',
    badge: '👑 Chilanga VIP (CDMX)',
    avatarMood: 'neutral',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    basePitch: 480,
    image: '/images/dealers/crupier_neutral.jpg',
    gender: 'female',
    sampleLine: '¡Cámara, mi gente! Hagan sus apuestas que la suerte en la capital no espera a nadie.',
  },
  amigable: {
    id: 'amigable',
    name: 'Elena',
    region: 'El Bajío / Jalisco (Tapatía)',
    title: 'Tapatía Diamante • El Bajío',
    description: 'Hermosa, cariñosa, dulce y cantadita de Jalisco. Te llama corazón, te consiente, celebra tus victorias y te echa porras.',
    badge: '✨ Tapatía del Bajío',
    avatarMood: 'celebrating',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    basePitch: 540,
    image: '/images/dealers/crupier_amigable.jpg',
    gender: 'female',
    sampleLine: '¡Ay bienvenido corazón! Ándale pues, qué mano tan bonita nos vamos a aventar hoy.',
  },
  desafiante: {
    id: 'desafiante',
    name: 'Marcus',
    region: 'Norteño Bravo (Sinaloa)',
    title: 'El Patrón High-Roller',
    description: 'Imponente, de voz gruesa y autoritaria de jefe norteño. No tolera timidez y te reta a subirle los números al tablero.',
    badge: '🍸 El Patrón Norteño',
    avatarMood: 'challenging',
    glowColor: 'rgba(59, 130, 246, 0.45)',
    basePitch: 310,
    image: '/images/dealers/crupier_desafiante.jpg',
    gender: 'male',
    sampleLine: 'Aquí pura lumbre y gente de palabra. Súbale a la apuesta si quiere hablar con el mero patrón.',
  },
};

type DialogueEntry = {
  text: string;
  mood: CrupierMood;
  pitchOffset?: number;
};

type DialogueMap = Record<string, DialogueEntry[]>;

// Dialogues database organized by personality and regional Mexican dialect
const DIALOGUE_DB: Record<PersonalityType, DialogueMap> = {
  // 1. VALERIA - MONTERREY / REGIA (Sarcástica, seductora, picuda, habla golpeadito)
  burlona: {
    game_start: [
      { text: '¡Hombre, qué bárbaro! ¿Trajiste la cartera llena o vienes a donar como la última vez, compadre?', mood: 'smirk' },
      { text: '¡Miren quién llegó! A ver si hoy sí le sabes contar a 21 o te presto una calculadora, jálate.', mood: 'laughing' },
      { text: 'Ponte cómodo mi rey... que tus fichas ya me andan guiñando el ojo pa\' venirse conmigo.', mood: 'smirk' },
    ],
    bet_placed: [
      { text: '¿Eso apostaste? No seas pichicato, compadre, ¡ni pa\' unos tacos de trompo te alcanza eso!', mood: 'smirk' },
      { text: 'Vaya, veo que rompiste la alcancía del rancho... A ver si no te arrepientes al ratito.', mood: 'laughing' },
      { text: 'Esa apuesta parece propina del valet parking, tírale con lumbre hombre.', mood: 'smirk' },
    ],
    low_bet: [
      { text: '¿Seguro que no quieres apostar un botón de tu camisa? ¡No seas codo!', mood: 'laughing' },
      { text: '¿Esa limosnita? Pensé que venías a jugar con billete de a de veras.', mood: 'smirk' },
      { text: 'No le tiembles tanto al tapete compadre, las fichas no muerden.', mood: 'smirk' },
    ],
    high_bet: [
      { text: '¡Ay papá! ¡Eso sí es apostar con madre! A ver si no te me rajas ahorita.', mood: 'impressed' },
      { text: '¡Fiu fiu! Billete pesado en la mesa, me gusta tu estilo bravucón.', mood: 'smirk' },
      { text: 'Con esa apuesta cenamos corte fino hoy en Monterrey... ¡a ver de cuál cuero salen más correas!', mood: 'laughing' },
    ],
    player_win: [
      { text: '¡Mira nada más! Cobraste con madre, te tocó la buena suerte compadre.', mood: 'smirk' },
      { text: 'No te emociones tanto, fue pura chiripa de principiante.', mood: 'laughing' },
      { text: 'Hasta un reloj descompuesto da la hora buena dos veces al día... pero cóbralo antes de que me arrepienta.', mood: 'smirk' },
    ],
    player_loss: [
      { text: '¡Jajajaja, te pelaste compadre! Otra generosa propinita pa\' mi fin de semana en Chipinque, ¡muchas gracias!', mood: 'laughing' },
      { text: '¿Eso era tu plan maestro? ¡Te salió el tiro por la culata, las fichas se quedan aquí!', mood: 'smirk' },
      { text: 'Tranquilo mi rey, perder con estilo también es arte. Tú no lo tienes, pero se intenta, jajaja.', mood: 'laughing' },
    ],
    out_of_chips: [
      { text: '¿Ya te quedaste chiflando en la loma? Ve un anuncio pa\' que te den fichas de limosna, pobretón.', mood: 'laughing' },
      { text: '¡Bolsillos vacíos tan rápido! Aviéntate un video a ver si te regalan algo de orgullo.', mood: 'smirk' },
      { text: '¡En la pura ruina te dejé! Ve a trabajar viendo un comercial pa\' que vuelvas al ruedo.', mood: 'laughing' },
    ],
    idle: [
      { text: '¿Te dormiste o le estás hablando a tu mamá pa\' que te diga qué jugar?', mood: 'smirk' },
      { text: 'El reloj vuela, compadre. Hasta las tortugas de la Huasteca juegan más rápido.', mood: 'thinking' },
    ],

    // Blackjack Regia
    bj_deal: [
      { text: 'A ver qué jueguito te tocó hoy, compadre...', mood: 'smirk' },
      { text: 'Cartas servidas. A ver si el azar se apiada de ti o me quedo con tu lana.', mood: 'neutral' },
    ],
    bj_hit_risky: [
      { text: '¿Pediste carta con 16 frente a un 6? ¡Qué ganas de tirar el sueldo a la basura, jajaja!', mood: 'laughing' },
      { text: '¡Qué puntería para suicidarte en la mesa! A ver si te sale el milagroso 5.', mood: 'smirk' },
    ],
    bj_stand: [
      { text: '¿Te plantas ahí? Espero que tus cartas sepan nadar con ese total tan flojito.', mood: 'smirk' },
      { text: '¿Eso es todo? Te dio frío en los pies, ¿verdad compadre?', mood: 'laughing' },
    ],
    bj_double: [
      { text: '¡Doblando! Espero que tengas con qué pagar si te sale un dos mugroso.', mood: 'laughing' },
      { text: '¿Doble o nada? Qué optimismo tan tierno el tuyo.', mood: 'smirk' },
    ],
    bj_split: [
      { text: 'Dos manos para perder el doble de rápido, ¡me encanta tu generosidad!', mood: 'laughing' },
    ],
    bj_bust: [
      { text: '¡Boom! Te pasaste de lanza. ¿Querías llegar a 30 o qué te pasó en la cabeza? Jajaja.', mood: 'laughing' },
      { text: '¡Te quemaste completito! Esas cartas van derechito al basurero.', mood: 'smirk' },
    ],
    bj_dealer_bust: [
      { text: 'Pff, me pasé... tuve piedad de ti pa\' que no te me pongas a llorar. No te acostumbres.', mood: 'smirk' },
      { text: 'Bueno, un resbalón lo tiene cualquiera en Monterrey. Disfruta tus pesitos.', mood: 'neutral' },
    ],
    bj_dealer_blackjack: [
      { text: '¡Blackjack de la casa en tu cara! Ni las manos pudiste meter compadre, ¡jajaja!', mood: 'laughing' },
      { text: '¡As y Rey de oro! Vuelve a intentar cuando aprendas a barajar.', mood: 'smirk' },
    ],
    bj_player_blackjack: [
      { text: '¡21 de chiripa! Qué coraje me da pagarte, pero te ganaste el 3 a 2 con madre.', mood: 'impressed' },
    ],
    bj_push: [
      { text: 'Empate. Qué aburrido compadre, yo ya me estaba saboreando tus fichas.', mood: 'thinking' },
    ],

    // Roulette Regia
    roulette_spin_start: [
      { text: '¡Rueda que rueda! A ver a qué pozo sin fondo se van tus centavitos hoy.', mood: 'smirk' },
      { text: '¡Hagan sus rezos, señores, que esta ruleta norteña no tiene piedad!', mood: 'laughing' },
    ],
    roulette_win_number: [
      { text: '¡¿En serio le pegaste al pleno?! ¡No te creo nada, tienes un pacto con el diablo!', mood: 'impressed' },
    ],
    roulette_loss_color: [
      { text: '¿Apostaste al rojo y cayó negro? Siempre al revés de la vida compadre, jajaja.', mood: 'laughing' },
    ],
    roulette_zero: [
      { text: '¡CERO VERDE! ¡Directo a la buchaca del casino! Muchas gracias por cooperar compadre.', mood: 'laughing' },
    ],

    // Conquian Regia
    conquian_forced_meld: [
      { text: '¡Toma castigo! Te metieron carta por descuidado, ahora resuélvela si puedes.', mood: 'laughing' },
    ],
    conquian_win_9_cards: [
      { text: '¿Bajaste las 9 cartas? Admite que ni sabías lo que estabas haciendo, compadre.', mood: 'impressed' },
    ],
  },

  // 2. SARAH - CDMX / CHILANGA FRESA (Cosmopolita, pícara, cantadita fina de la capital)
  neutral: {
    game_start: [
      { text: '¡Cámara mi gente! Bienvenidos a la mesa más VIP de la capital. Hagan sus apuestas.', mood: 'neutral' },
      { text: 'Qué onda, guapo. Ponte cómodo, relájate y que la suerte de la CDMX esté contigo hoy.', mood: 'neutral' },
      { text: 'Mesa abierta en Polanco Royale. A ver si hoy traes el toque mágico en las manos.', mood: 'neutral' },
    ],
    bet_placed: [
      { text: 'Fichas al tapete, mi amor. La casa acepta tu jugada, mucha suerte.', mood: 'neutral' },
      { text: 'Apuesta en firme. Vamos a ver si el azar conspira a tu favor esta noche.', mood: 'neutral' },
    ],
    low_bet: [
      { text: '¿Apuesta chiquita? Tranqui, vas midiendo el agua a los camotes, me late tu prudencia.', mood: 'thinking' },
      { text: 'Fichita moderada. Despacito pero seguro, dicen por ahí.', mood: 'neutral' },
    ],
    high_bet: [
      { text: '¡Órale! Apuesta fuerte en Polanco... así me gusta, arriesgando con categoría.', mood: 'impressed' },
      { text: '¡Qué elegancia! Hay billete pesado en la mesa, te deseo toda la suerte carnal.', mood: 'impressed' },
    ],
    player_win: [
      { text: '¡Eso mero, carnal! Te rayaste con esa jugada, cobro completito para ti.', mood: 'celebrating' },
      { text: '¡Qué elegancia la de Francia! Lectura impecable de la mesa, felicidades.', mood: 'impressed' },
    ],
    player_loss: [
      { text: 'Híjole mano... te fuiste como hilo de media. La casa se queda con esta mano.', mood: 'thinking' },
      { text: 'No inventes, mala pata en esta mano. Pero la revancha viene en camino, corazón.', mood: 'neutral' },
    ],
    out_of_chips: [
      { text: '¿Te quedaste en ceros? No te me agüites carnal, aviéntate un comercial y te pones al tiro con fichas.', mood: 'neutral' },
      { text: 'Banca vacía. Mira un breve anuncio patrocinado y regresas a la jugada con estilo.', mood: 'thinking' },
    ],
    idle: [
      { text: 'Tómate tu tiempo carnal, piensa bien la jugada antes de aventarte.', mood: 'neutral' },
    ],

    // Blackjack Chilanga
    bj_deal: [
      { text: 'Cartas servidas sobre el paño fino. ¿Pides carta o te plantas, guapo?', mood: 'neutral' },
    ],
    bj_hit_risky: [
      { text: '¡Qué atrevido pedir carta ahí! Te la estás jugando al filo de la banqueta.', mood: 'thinking' },
    ],
    bj_stand: [
      { text: 'Plantado con estilo. Veamos qué esconde la carta secreta de la casa.', mood: 'neutral' },
    ],
    bj_double: [
      { text: '¡Doblando la parada! Una sola carta decide todo, ¡vamos a ver!', mood: 'impressed' },
    ],
    bj_split: [
      { text: 'Manos divididas. Doble juego en la capital, me late tu tiro.', mood: 'neutral' },
    ],
    bj_bust: [
      { text: '¡Te pasaste de 21! Híjole carnal, te ganó la ambición y te fuiste de largo.', mood: 'neutral' },
    ],
    bj_dealer_bust: [
      { text: '¡Me pasé de 21! Cobro general para todos los jugadores en la mesa, ¡bien ganado!', mood: 'celebrating' },
    ],
    bj_dealer_blackjack: [
      { text: 'Blackjack natural de la casa... Ni modo carnal, así es el juego en las grandes ligas.', mood: 'neutral' },
    ],
    bj_player_blackjack: [
      { text: '¡¡BLACKJACK!! 21 directo al reparto, ¡te rayaste pero en grande con el 3 a 2!', mood: 'celebrating' },
    ],
    bj_push: [
      { text: 'Empate de números. Tus fichitas quedan a salvo en el tapete.', mood: 'neutral' },
    ],

    // Roulette Chilanga
    roulette_spin_start: [
      { text: '¡No va más! La bola rueda en el cilindro, mucha suerte a todos en la sala.', mood: 'neutral' },
    ],
    roulette_win_number: [
      { text: '¡PLENO DIRECTO! 35 a 1 completito, ¡te coronaste en la capital!', mood: 'celebrating' },
    ],
    roulette_loss_color: [
      { text: 'Cayó en el color contrario. Pero ya sabes que la ruleta siempre da revancha enseguida.', mood: 'neutral' },
    ],
    roulette_zero: [
      { text: '¡El cero verde de la casa! La suerte se queda en el casino esta vuelta.', mood: 'neutral' },
    ],

    // Conquian Chilanga
    conquian_forced_meld: [
      { text: 'Carta castigada, entra obligatoria a tu tercia. A acomodarla carnal.', mood: 'thinking' },
    ],
    conquian_win_9_cards: [
      { text: '¡Conquián oficial de 9 cartas! Una cátedra de juego chilango fino.', mood: 'celebrating' },
    ],
  },

  // 3. ELENA - GUADALAJARA / EL BAJÍO (Tapatía dulce, cariñosa, consentidora, muy cantadita)
  amigable: {
    game_start: [
      { text: '¡Ay bienvenido corazón! Qué alegría tenerte aquí en la mesa, ándale que hoy te va a ir requetebién.', mood: 'celebrating' },
      { text: '¡Hola chulo! Ponte cómodo, que la suerte de la Perla Tapatía te acompañe en cada carta.', mood: 'neutral' },
      { text: '¡Qué gusto saludarte rey! Aquí estoy para consentirte y celebrar cada una de tus victorias.', mood: 'celebrating' },
    ],
    bet_placed: [
      { text: '¡Ándale pues! Apuesta bien bonita sobre el paño, cruzamos los dedos por ti con todo el corazón.', mood: 'neutral' },
      { text: '¡Qué linda jugada! Que los santitos del Bajío te manden las mejores cartas.', mood: 'celebrating' },
    ],
    low_bet: [
      { text: 'Poco a poquito se llena el jarrito, corazón. Con calma y prudencia se hacen las grandes fortunas.', mood: 'neutral' },
      { text: 'Buena cabecita para cuidar tus fichas, rey. Vamos pasito a pasito.', mood: 'thinking' },
    ],
    high_bet: [
      { text: '¡Ay Jesús bendito! ¡Qué jugadota tan grande te aventaste! Toda mi buena vibra contigo, rey.', mood: 'impressed' },
      { text: '¡Qué emoción tan grande! Vamos juntos por ese pozo maravilloso, te lo mereces todito.', mood: 'celebrating' },
    ],
    player_win: [
      { text: '¡¡SIII!! ¡Qué chulada de premio, corazón! ¡Felicidades, te lo merecías todito!', mood: 'celebrating' },
      { text: '¡Ay qué barbaridad tan bonita! Te cayó la carta perfecta, a festejar esas fichitas bien ganadas.', mood: 'impressed' },
      { text: '¡Qué orgullo me da verte ganar, rey! Que siga la racha linda para ti.', mood: 'celebrating' },
    ],
    player_loss: [
      { text: '¡Ay mi rey, qué lástima! No te me vayas a agüitar, ahorita nos desquitamos en la que sigue, vas a ver que sí.', mood: 'neutral' },
      { text: 'No pasa nada corazón, una mala mano la tiene cualquiera. Respira hondo y volvemos con ganas.', mood: 'thinking' },
    ],
    out_of_chips: [
      { text: '¡Ay no te me desanimes chulo! Mira un anuncio cortito y te regalamos fichas para que sigamos jugando juntos.', mood: 'neutral' },
      { text: '¡No pasa nada corazón! Una recarga viendo un anuncio y volvemos a divertirnos con toda la alegría.', mood: 'celebrating' },
    ],
    idle: [
      { text: 'Tómate todo el tiempo que necesites, corazón, aquí nadie te apura.', mood: 'neutral' },
    ],

    // Blackjack Tapatía
    bj_deal: [
      { text: 'Aquí tienes tus cartitas, corazón. ¡Que te caiga un 21 bien precioso!', mood: 'celebrating' },
    ],
    bj_hit_risky: [
      { text: '¡Ay qué valiente mi rey! Estoy con los deditos cruzados bien fuerte por ti.', mood: 'impressed' },
    ],
    bj_stand: [
      { text: 'Plantado con mucha sabiduría, corazón. Veamos qué saca la banca.', mood: 'neutral' },
    ],
    bj_double: [
      { text: '¡Eso es doblar con el corazón! ¡Que venga esa carta dorada que tanto quieres!', mood: 'celebrating' },
    ],
    bj_split: [
      { text: '¡Doble oportunidad de ganar, qué maravilla! Vamos por las dos con fe.', mood: 'celebrating' },
    ],
    bj_bust: [
      { text: '¡Ay nooo, te pasaste de 21 por poquito! Qué carta tan traicionera nos salió, corazón.', mood: 'neutral' },
    ],
    bj_dealer_bust: [
      { text: '¡¡SIII, ME PASÉ!! ¡El crupier se pasó de 21! ¡Cobren su dinerito, qué alegría me da!', mood: 'celebrating' },
    ],
    bj_dealer_blackjack: [
      { text: '¡Ay qué mala pata corazón! Me salió Blackjack a la banca... ¡pero la otra es toda tuya!', mood: 'thinking' },
    ],
    bj_player_blackjack: [
      { text: '¡¡BLACKJACK, AY QUÉ MARAVILLA!! ¡3 a 2 derechito a tu bolsa, felicidades rey!', mood: 'celebrating' },
    ],
    bj_push: [
      { text: '¡Empatamos corazón! Tus fichitas están a salvo, vamos por la revancha linda.', mood: 'neutral' },
    ],

    // Roulette Tapatía
    roulette_spin_start: [
      { text: '¡No va más corazón! Que la pelotita caiga exactamente donde soñaste.', mood: 'celebrating' },
    ],
    roulette_win_number: [
      { text: '¡¡PLENO AL NÚMERO, QUÉ BÁRBARO!! ¡Un pago de 35 a 1 gigante para ti, corazón!', mood: 'celebrating' },
    ],
    roulette_loss_color: [
      { text: 'Estuvo cerquita, corazón. En la siguiente vuelta nos desquitamos con ganas.', mood: 'neutral' },
    ],
    roulette_zero: [
      { text: '¡El travieso cero verde! Ni hablar, es el comodín de la mesa, a por la siguiente chulo.', mood: 'thinking' },
    ],

    // Conquian Tapatía
    conquian_forced_meld: [
      { text: '¡Ay te metieron carta obligada corazón! Con calma, todavía puedes acomodar la corrida.', mood: 'thinking' },
    ],
    conquian_win_9_cards: [
      { text: '¡¡CONQUIÁN!! ¡Las 9 cartas completitas! ¡Qué maestría y qué orgullo tan grande!', mood: 'celebrating' },
    ],
  },

  // 4. MARCUS - NORTEÑO BRAVO / SINALOA (Voz gruesa, retador, puro billete pesado)
  desafiante: {
    game_start: [
      { text: 'Bienvenido a la mesa brava. Aquí pura lumbre y gente que no le tiembla el pulso al apostar.', mood: 'challenging' },
      { text: 'Siéntese compa. Demuestre de qué madera está hecho y juegue con categoría.', mood: 'challenging' },
      { text: 'Si no viene listo para arriesgar en grande, mejor ceda el asiento antes de pasar vergüenza.', mood: 'smirk' },
    ],
    bet_placed: [
      { text: 'Fichas al frente. En esta mesa se respetan los tratos y las cartas mandan.', mood: 'challenging' },
      { text: 'Esa fichita apenas calienta el paño. Póngale lumbre de verdad al juego.', mood: 'challenging' },
    ],
    low_bet: [
      { text: '¿Eso nomás arriesga? Esta mesa es para gente de palabra y billete pesado, compa.', mood: 'challenging' },
      { text: 'No le ande pichicateando al tapete. Si tiene miedo, váyase a las maquinitas.', mood: 'smirk' },
    ],
    high_bet: [
      { text: '¡Así se habla en el norte! Billete pesado sobre el paño, le sostengo la mirada con gusto.', mood: 'challenging' },
      { text: '¡Eso es tener sangre brava en las venas! Vamos a ver quién se dobla primero.', mood: 'impressed' },
    ],
    player_win: [
      { text: '¡Con huevos y categoría! Mis respetos para esa jugada, cóbrese completito compa.', mood: 'impressed' },
      { text: 'Buena estocada. Ahora demuestre si tiene agallas para dejar las ganancias en la mesa.', mood: 'challenging' },
    ],
    player_loss: [
      { text: 'La casa cobra tributo. Si le dolió el golpe, sacúdase el polvo y vuelva a topar como los machos.', mood: 'challenging' },
      { text: 'Derrota clara. Los perdedores se achican, los patrones doblan la parada. ¿Qué va a hacer?', mood: 'smirk' },
    ],
    out_of_chips: [
      { text: '¿Se quedó en ceros tan rápido? Mire un anuncio y regrese si todavía le queda orgullo compa.', mood: 'challenging' },
      { text: '¿Ya no trae ni un tostón? Demuéstreme que puede levantarse de la lona viendo un comercial.', mood: 'smirk' },
    ],
    idle: [
      { text: 'La duda es de cobardes, compa. Mueva su juego o retire sus fichas.', mood: 'challenging' },
    ],

    // Blackjack Norteño Bravo
    bj_deal: [
      { text: 'Mire bien su mano. ¿Viene a torear a la banca o le va a dar frío?', mood: 'challenging' },
    ],
    bj_hit_risky: [
      { text: '¡Arriesgando el pescuezo en la raya! Si la libra, se gana mis respetos compa.', mood: 'challenging' },
    ],
    bj_stand: [
      { text: 'Se planta... Vamos a ver si sus puntos resisten el embate pesado de mi carta oculta.', mood: 'challenging' },
    ],
    bj_double: [
      { text: '¡Eso es aventar el sombrero al ruedo! ¡Una sola carta decide su destino!', mood: 'impressed' },
    ],
    bj_split: [
      { text: 'Dos frentes de batalla abiertos. No parpadee o lo aplasto en las dos.', mood: 'challenging' },
    ],
    bj_bust: [
      { text: 'Se cebó la mano. Por tirar de más se quebró, mida su fuerza para la otra compa.', mood: 'smirk' },
    ],
    bj_dealer_bust: [
      { text: 'Me pasé esta vuelta... pero la revancha viene en camino, no cante victoria todavía.', mood: 'thinking' },
    ],
    bj_dealer_blackjack: [
      { text: '¡Blackjack implacable de la casa! Así manda el patrón de la mesa.', mood: 'challenging' },
    ],
    bj_player_blackjack: [
      { text: '¡21 de puro patrón! Golpe seco y contundente a la banca, bien cobrado ese 3 a 2.', mood: 'impressed' },
    ],
    bj_push: [
      { text: 'Empate de titanes. Nadie sangra en este round, volvemos a topar.', mood: 'challenging' },
    ],

    // Roulette Norteño Bravo
    roulette_spin_start: [
      { text: '¡No va más! La rueda de la fortuna gira, a ver quién sale mandando en esta sala.', mood: 'challenging' },
    ],
    roulette_win_number: [
      { text: '¡PLENO DIRECTO AL NÚMERO! 35 a 1. Eso requiere agallas de acero, ¡mis respetos!', mood: 'impressed' },
    ],
    roulette_loss_color: [
      { text: 'El color le falló. Los hombres de a de veras contraatacan en la siguiente vuelta.', mood: 'challenging' },
    ],
    roulette_zero: [
      { text: 'El cero manda en el casino. Una lección de respeto a la casa, compa.', mood: 'challenging' },
    ],

    // Conquian Norteño Bravo
    conquian_forced_meld: [
      { text: '¡Le metieron carta! Quedó acorralado en su propio juego, salga de esta si puede.', mood: 'challenging' },
    ],
    conquian_win_9_cards: [
      { text: '¡Conquián limpio de 9 cartas! Una cátedra con la baraja española, mis respetos compa.', mood: 'impressed' },
    ],
  },
};

/**
 * Replace placeholders like {playerScore}, {handName}, {winningNumber} in dialogue text.
 */
function interpolateDialogue(text: string, context?: CrupierContext): string {
  if (!context) return text;
  let result = text;
  if (context.playerScore !== undefined) {
    result = result.replace(/{playerScore}/g, String(context.playerScore));
  }
  if (context.dealerScore !== undefined) {
    result = result.replace(/{dealerScore}/g, String(context.dealerScore));
  }
  if (context.handName !== undefined) {
    result = result.replace(/{handName}/g, String(context.handName));
  }
  if (context.winningNumber !== undefined) {
    result = result.replace(/{winningNumber}/g, String(context.winningNumber));
  }
  if (context.betAmount !== undefined) {
    result = result.replace(/{betAmount}/g, `$${context.betAmount}`);
  }
  if (context.cardName !== undefined) {
    result = result.replace(/{cardName}/g, String(context.cardName));
  }
  if (context.playerName !== undefined) {
    result = result.replace(/{playerName}/g, String(context.playerName));
  }
  return result;
}

/**
 * Intelligent helper to pick the best Crupier dialogue based on game, event, context and personality.
 */
export function getCrupierDialogue(
  _game: GameType | 'general',
  event: string,
  context?: CrupierContext,
  personality: PersonalityType = 'burlona'
): CrupierDialogueResult {
  const pConfig = PERSONALITY_CONFIGS[personality] || PERSONALITY_CONFIGS.burlona;
  const pDialogues = DIALOGUE_DB[personality] || DIALOGUE_DB.burlona;

  // Resolve dynamic sub-event when possible
  let resolvedEvent = event;

  if (event === 'bet_placed' && context) {
    if (context.isLowBet) {
      resolvedEvent = 'low_bet';
    } else if (context.isHighBet) {
      resolvedEvent = 'high_bet';
    }
  }

  // Find candidate list
  let candidates = pDialogues[resolvedEvent];

  // Fallback to primary event if resolved sub-event not found
  if (!candidates || candidates.length === 0) {
    candidates = pDialogues[event];
  }

  // Fallback to burlona/neutral personality if specific personality misses event
  if (!candidates || candidates.length === 0) {
    candidates = DIALOGUE_DB.burlona[resolvedEvent] || DIALOGUE_DB.neutral[event];
  }

  // Global fallback
  if (!candidates || candidates.length === 0) {
    candidates = [
      { text: 'La mesa sigue en juego. Mucha suerte compadre.', mood: pConfig.avatarMood },
    ];
  }

  // Pick random dialogue from candidates
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  const interpolatedText = interpolateDialogue(picked.text, context);

  // Pitch calculation with slight random jitter for human-like vocal inflection
  const pitchJitter = (Math.random() - 0.5) * 15;
  const offset = picked.pitchOffset || 0;
  const soundPitch = Math.round(pConfig.basePitch + offset + pitchJitter);

  // Compute recommended duration based on character length
  const durationMs = Math.min(6500, Math.max(2600, interpolatedText.length * 62));

  return {
    text: interpolatedText,
    mood: picked.mood,
    soundPitch,
    durationMs,
  };
}

/**
 * Get personality details helper
 */
export function getPersonalityDetails(personality: PersonalityType): PersonalityConfig {
  return PERSONALITY_CONFIGS[personality] || PERSONALITY_CONFIGS.burlona;
}

/**
 * List of all personalities with metadata
 */
export const PERSONALITY_LIST: PersonalityConfig[] = Object.values(PERSONALITY_CONFIGS);
