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
  title: string;
  description: string;
  badge: string;
  avatarMood: CrupierMood;
  glowColor: string;
  basePitch: number;
  image: string;
  gender: 'female' | 'male';
}

export const PERSONALITY_CONFIGS: Record<PersonalityType, PersonalityConfig> = {
  neutral: {
    id: 'neutral',
    name: 'Sarah',
    title: 'Crupier VIP • Terciopelo Negro',
    description: 'Seductora, elegante y profesional. Te acompaña con clase y una sonrisa cautivadora.',
    badge: '👑 VIP Royale',
    avatarMood: 'neutral',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    basePitch: 480,
    image: '/images/dealers/crupier_neutral.jpg',
    gender: 'female',
  },
  burlona: {
    id: 'burlona',
    name: 'Valeria',
    title: 'Provocadora & Sarcástica',
    description: 'Sensual, atrevida y burlona. Se ríe con picardía cuando pierdes y te desafía a recuperarte.',
    badge: '💋 Burlona',
    avatarMood: 'smirk',
    glowColor: 'rgba(225, 29, 72, 0.5)',
    basePitch: 520,
    image: '/images/dealers/crupier_burlona.jpg',
    gender: 'female',
  },
  desafiante: {
    id: 'desafiante',
    name: 'Marcus',
    title: 'High-Roller Boss',
    description: 'Poderoso, elegante y desafiante. Te mira con intensidad y te reta a subir la apuesta.',
    badge: '🍸 Smoking Boss',
    avatarMood: 'challenging',
    glowColor: 'rgba(59, 130, 246, 0.45)',
    basePitch: 320,
    image: '/images/dealers/crupier_desafiante.jpg',
    gender: 'male',
  },
  amigable: {
    id: 'amigable',
    name: 'Elena',
    title: 'Anfitriona Diamante',
    description: 'Hermosa, radiante y encantadora. Celebra cada una de tus victorias con una voz deslumbrante.',
    badge: '✨ Encantadora',
    avatarMood: 'celebrating',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    basePitch: 500,
    image: '/images/dealers/crupier_amigable.jpg',
    gender: 'female',
  },
};

type DialogueEntry = {
  text: string;
  mood: CrupierMood;
  pitchOffset?: number;
};

type DialogueMap = Record<string, DialogueEntry[]>;

// Dialogues database organized by personality and event
const DIALOGUE_DB: Record<PersonalityType, DialogueMap> = {
  // 1. NEUTRAL: Formal, elegant casino dealer
  neutral: {
    game_start: [
      { text: 'Buenas noches. Bienvenidos a Casino Royale. Hagan sus apuestas.', mood: 'neutral' },
      { text: 'Mesa abierta. Que la fortuna y la destreza los acompañen hoy.', mood: 'neutral' },
      { text: 'Sean bienvenidos. Las apuestas están formalmente abiertas.', mood: 'neutral' },
    ],
    bet_placed: [
      { text: 'Apuesta colocada sobre el tapete. Suerte en la jugada.', mood: 'neutral' },
      { text: 'Fichas registradas. La casa acepta su jugada.', mood: 'neutral' },
      { text: 'Apuesta en firme. Mucha suerte, caballero.', mood: 'neutral' },
    ],
    low_bet: [
      { text: 'Apuesta mínima aceptada. Procedemos con la mano.', mood: 'neutral' },
      { text: 'Fichas en juego. Una estrategia prudente.', mood: 'thinking' },
    ],
    high_bet: [
      { text: 'Apuesta mayor registrada. La casa reconoce su determinación.', mood: 'impressed' },
      { text: 'Monto considerable en la mesa. Buena suerte a todos.', mood: 'impressed' },
    ],
    player_win: [
      { text: 'Felicidades al jugador por esta destacada victoria.', mood: 'celebrating' },
      { text: 'Pago correspondiente entregado. Enhorabuena.', mood: 'neutral' },
      { text: 'Excelente lectura de juego. Pozo para el jugador.', mood: 'impressed' },
    ],
    player_loss: [
      { text: 'La casa toma la mano en esta ocasión. Siguiente ronda disponible.', mood: 'neutral' },
      { text: 'Resultado adverso. La fortuna cambia con cada mano.', mood: 'thinking' },
    ],
    out_of_chips: [
      { text: 'Su reserva de fichas se ha agotado. Puede solicitar una recarga para continuar en la mesa.', mood: 'neutral' },
      { text: 'Banca en cero. Mire un breve anuncio de patrocinio para recibir una dotación de cortesía.', mood: 'thinking' },
      { text: 'Fichas terminadas. Tiene la opción de ver un mensaje patrocinado para reiniciar su juego.', mood: 'neutral' },
    ],
    idle: [
      { text: 'Esperando la decisión del jugador para continuar.', mood: 'thinking' },
      { text: 'Tómese su tiempo para analizar la jugada.', mood: 'neutral' },
    ],

    // Blackjack Neutral
    bj_deal: [
      { text: 'Reparto inicial. Cartas servidas en la mesa.', mood: 'neutral' },
      { text: 'Cartas a la vista. ¿Desea pedir carta o plantarse?', mood: 'thinking' },
    ],
    bj_hit_risky: [
      { text: 'Pide carta con total comprometido. Veamos qué carta le concede el mazo.', mood: 'thinking' },
      { text: 'Decisión valiente al pedir carta en zona de riesgo.', mood: 'impressed' },
    ],
    bj_stand: [
      { text: 'Jugador se planta. Es el turno de la banca.', mood: 'neutral' },
      { text: 'Plantado. Verifiquemos la carta oculta del crupier.', mood: 'thinking' },
    ],
    bj_double: [
      { text: 'Jugador dobla la apuesta. Una sola carta definitiva.', mood: 'thinking' },
    ],
    bj_split: [
      { text: 'Mano dividida. Jugamos dos manos independientes.', mood: 'neutral' },
    ],
    bj_bust: [
      { text: 'Ha superado los 21 puntos. Mano no válida. Casa gana.', mood: 'neutral' },
      { text: 'Más de 21. Se retira la apuesta del tapete.', mood: 'thinking' },
    ],
    bj_dealer_bust: [
      { text: 'El crupier se ha pasado de 21. Pago general para todos los jugadores.', mood: 'celebrating' },
      { text: 'La banca supera 21. Se acreditan las ganancias a su favor.', mood: 'impressed' },
    ],
    bj_dealer_blackjack: [
      { text: 'Blackjack natural para la casa. Lo lamento, caballero.', mood: 'neutral' },
      { text: 'As y figura para el crupier. Mano terminada.', mood: 'neutral' },
    ],
    bj_player_blackjack: [
      { text: '¡Blackjack natural! Pago 3 a 2 para el jugador.', mood: 'celebrating' },
      { text: '21 directo al reparto. Extraordinaria mano.', mood: 'impressed' },
    ],
    bj_push: [
      { text: 'Empate de totales. La apuesta se mantiene intacta.', mood: 'neutral' },
    ],

    // Poker Neutral
    poker_preflop_raise: [
      { text: 'Subida de apuesta antes del flop. Acción incrementada.', mood: 'neutral' },
      { text: 'El jugador eleva el pozo pre-flop. Esperando respuestas.', mood: 'thinking' },
    ],
    poker_flop: [
      { text: 'Se descubren las tres cartas del flop.', mood: 'neutral' },
    ],
    poker_turn: [
      { text: 'Carta del turn servida sobre la mesa.', mood: 'thinking' },
    ],
    poker_river_bluff: [
      { text: 'Fuerte presión en la quinta carta del river.', mood: 'thinking' },
      { text: 'Apuesta decisiva en el river. Momento cumbre de la mano.', mood: 'impressed' },
    ],
    poker_win: [
      { text: 'Mano ganadora verificada. El pozo le corresponde íntegramente.', mood: 'celebrating' },
      { text: 'Gran demostración de estrategia pokeril. Enhorabuena.', mood: 'impressed' },
    ],
    poker_bad_beat: [
      { text: 'Golpe inesperado en la última calle. El azar ha favorecido a la casa.', mood: 'thinking' },
      { text: 'Una mano desafortunada contra pronóstico.', mood: 'neutral' },
    ],
    poker_fold: [
      { text: 'El jugador se retira. Cartas al descarte.', mood: 'neutral' },
    ],

    // Roulette Neutral
    roulette_spin_start: [
      { text: '¡No va más! La bola está en giro sobre el cilindro.', mood: 'neutral' },
      { text: 'Rien ne va plus. Buena suerte a todas las apuestas.', mood: 'neutral' },
    ],
    roulette_ball_bouncing: [
      { text: 'La bola pierde inercia y salta entre las celdas.', mood: 'thinking' },
      { text: 'Buscando casilla definitiva en el plato.', mood: 'thinking' },
    ],
    roulette_win_number: [
      { text: '¡Pleno acertado! Pago de 35 veces la apuesta.', mood: 'celebrating' },
      { text: 'Acierto directo al número. Magnífica intuición.', mood: 'impressed' },
    ],
    roulette_win_outside: [
      { text: 'Apuesta exterior ganadora. Cobro 1 a 1 entregado.', mood: 'neutral' },
    ],
    roulette_loss_color: [
      { text: 'La bola cayó en el color contrario. Casa retiene la apuesta.', mood: 'neutral' },
    ],
    roulette_zero: [
      { text: 'Número cero verde. Las suertes sencillas corresponden al casino.', mood: 'neutral' },
    ],

    // Conquian Neutral
    conquian_draw: [
      { text: 'Carta tomada del monte para análisis.', mood: 'thinking' },
    ],
    conquian_forced_meld: [
      { text: 'Carta castigada: entra obligatoriamente a una de sus combinaciones.', mood: 'thinking' },
      { text: 'Jugada obligada por la carta del descarte.', mood: 'neutral' },
    ],
    conquian_win_9_cards: [
      { text: '¡Conquián oficial! Nueve cartas combinadas satisfactoriamente.', mood: 'celebrating' },
      { text: 'Cierre magistral con 9 cartas en la mesa. Victoria confirmada.', mood: 'impressed' },
    ],
    conquian_discard: [
      { text: 'Carta depositada en el pozo de descarte.', mood: 'neutral' },
    ],
    conquian_meld: [
      { text: 'Combinación reglamentaria bajada al tapete.', mood: 'neutral' },
    ],
  },

  // 2. BURLONA: Sarcastic, mocking bad moves, witty, humorous
  burlona: {
    game_start: [
      { text: '¿Trajiste la cartera llena o vienes a donar como la última vez?', mood: 'smirk' },
      { text: '¡Miren quién llegó! A ver si hoy sí sabes contar hasta 21 o te presto una calculadora.', mood: 'laughing' },
      { text: 'Ponte cómodo... tus fichas ya me están diciendo que se quieren venir conmigo.', mood: 'smirk' },
    ],
    bet_placed: [
      { text: '¿Eso fue tu apuesta? Cuidado no vayas a quebrar al casino con esos dos pesos.', mood: 'smirk' },
      { text: 'Vaya, veo que hoy rompiste la alcancía del puerquito.', mood: 'laughing' },
      { text: 'Esa apuesta parece una propina para el valet parking.', mood: 'smirk' },
    ],
    low_bet: [
      { text: '¿Seguro que no quieres apostar un botón de camisa también?', mood: 'laughing' },
      { text: '¿Esa limosnita? Pensé que venías a jugar, no a pedir fiado.', mood: 'smirk' },
      { text: 'No tiembles tanto al empujar la fichita, no muerde.', mood: 'smirk' },
    ],
    high_bet: [
      { text: '¡Ay mi madre! O eres un genio millonario o te gusta vivir al borde del precipicio.', mood: 'impressed' },
      { text: '¡Caray! Alguien vino con ganas de quedar en la calle o salir en limusina.', mood: 'smirk' },
      { text: 'Fiu fiu... con eso comemos caviar hoy. A ver si no te arrepientes.', mood: 'laughing' },
    ],
    player_win: [
      { text: 'Hasta un reloj descompuesto da la hora correcta dos veces al día.', mood: 'smirk' },
      { text: 'No te emociones tanto, fue pura suerte de principiante.', mood: 'laughing' },
      { text: '¿Hiciste trampa o qué santo bajó a ayudarte? Bueno, cóbralo antes de que cambie de opinión.', mood: 'smirk' },
    ],
    player_loss: [
      { text: 'Otra generosa contribución para mi fondo de vacaciones. ¡Muchas gracias!', mood: 'laughing' },
      { text: '¿Eso era tu plan maestro? Porque funcionó... ¡pero a favor de la casa!', mood: 'smirk' },
      { text: 'Tranquilo, perder con estilo también es un arte. Tú no lo tienes, pero se intenta.', mood: 'laughing' },
    ],
    out_of_chips: [
      { text: '¿Te quedaste sin fichas? Mira un anuncio si quieres revancha, pobretón.', mood: 'laughing' },
      { text: '¿Bolsillos vacíos tan rápido? Ve un video publicitario a ver si te regalan algo de dignidad.', mood: 'smirk' },
      { text: '¡Te quedaste en la ruina! Ve a trabajar mirando un anuncio para que vuelvas al ruedo.', mood: 'laughing' },
    ],
    idle: [
      { text: '¿Te dormiste o estás llamando a tu mamá para que te diga qué hacer?', mood: 'smirk' },
      { text: 'El reloj corre, mi amigo. Hasta las tortugas juegan más rápido.', mood: 'thinking' },
    ],

    // Blackjack Burlona
    bj_deal: [
      { text: 'A ver qué porquería de cartas te tocó hoy...', mood: 'smirk' },
      { text: 'Cartas servidas. Veamos si el azar tiene piedad de ti.', mood: 'neutral' },
    ],
    bj_hit_risky: [
      { text: '¿Pediste carta con 16 frente a un 6? ¿Seguro que no quieres ayuda de un niño?', mood: 'laughing' },
      { text: '¿Carta con 16? Qué ganas de regalarle el sueldo a la casa.', mood: 'smirk' },
      { text: '¡Qué puntería para suicidarte en la mesa! A ver si sale el milagroso 5.', mood: 'laughing' },
    ],
    bj_stand: [
      { text: '¿Te plantas ahí? Espero que tus cartas sepan nadar con ese total tan flojo.', mood: 'smirk' },
      { text: '¿Eso es todo? Te dio frío en los pies, ¿verdad?', mood: 'laughing' },
    ],
    bj_double: [
      { text: '¡Doblando! Espero que tengas con qué pagar si te sale un 2.', mood: 'laughing' },
      { text: '¿Doble o nada? Qué optimismo tan tierno el tuyo.', mood: 'smirk' },
    ],
    bj_split: [
      { text: 'Dos manos para perder el doble de rápido. ¡Me encanta tu generosidad!', mood: 'laughing' },
    ],
    bj_bust: [
      { text: '¡Boom! Te pasaste de largo. ¿Querías llegar a 30 o qué?', mood: 'laughing' },
      { text: '¿Volaste tan alto que te quemaste con el sol? ¡Tus cartas van directo a la basura!', mood: 'smirk' },
      { text: 'Se pasó. Gracias por el depósito bancario sin comisiones.', mood: 'laughing' },
    ],
    bj_dealer_bust: [
      { text: 'Pff, tuve piedad de ti para que no llores. No te acostumbres.', mood: 'smirk' },
      { text: 'Bueno, un error de cálculo lo tiene cualquiera. Disfruta tus pesitos mientras duren.', mood: 'neutral' },
    ],
    bj_dealer_blackjack: [
      { text: '¡Blackjack de la casa! Ni las manos pudiste meter, criatura.', mood: 'laughing' },
      { text: '¡As y Rey en tu cara! Vuelve a intentar cuando aprendas a barajar.', mood: 'smirk' },
      { text: 'La perfección existe y hoy se llama crupier. Gracias por participar.', mood: 'laughing' },
    ],
    bj_player_blackjack: [
      { text: 'Bueno, bueno... hasta un ciego le da a la piñata alguna vez.', mood: 'smirk' },
      { text: '¡Blackjack! Qué rabia me da pagarte, pero te ganaste el 3 a 2.', mood: 'impressed' },
    ],
    bj_push: [
      { text: 'Empate. Qué aburrido, yo quería quitarte esas fichas.', mood: 'thinking' },
    ],

    // Poker Burlona
    poker_preflop_raise: [
      { text: '¿Subiendo pre-flop? ¿Tienes ases o solo estás fingiendo para no llorar?', mood: 'smirk' },
      { text: 'Mucho ruido antes de ver las cartas comunitarias... a ver si no sales corriendo luego.', mood: 'laughing' },
    ],
    poker_flop: [
      { text: 'Tres cartas en la mesa... ¿alguna te sirve o puro aire?', mood: 'smirk' },
    ],
    poker_turn: [
      { text: 'El turn no miente. Tu cara dice que estás en problemas.', mood: 'smirk' },
    ],
    poker_river_bluff: [
      { text: '¿Faroleando en el river con par de dos? Ni mi abuela se lo traga.', mood: 'laughing' },
      { text: 'Huele a humo ese river, estás temblando de miedo detrás de esa apuesta.', mood: 'smirk' },
      { text: 'Se te ve el nerviosismo desde el satélite... ¿seguro que quieres seguir?', mood: 'laughing' },
    ],
    poker_win: [
      { text: '¿Te llevaste el pozo con eso? Vaya suerte de principiante.', mood: 'smirk' },
      { text: 'Cobraste el pozo, sí, pero no te me creas Daniel Negreanu todavía.', mood: 'laughing' },
    ],
    poker_bad_beat: [
      { text: '¡Ouch! El river te clavó el puñal por la espalda... ¿te dolió mucho?', mood: 'laughing' },
      { text: '¡Bad beat de antología! Eso te pasa por soñar despierto.', mood: 'smirk' },
      { text: 'Tenías el 90% y perdiste... la vida es cruel y el poker más, jajaja.', mood: 'laughing' },
    ],
    poker_fold: [
      { text: '¿Te retiras? ¡Gallina! Qué rápido soltaste la toalla.', mood: 'laughing' },
      { text: 'Adiós fichitas... mejor retirarse que quedar en calzones, supongo.', mood: 'smirk' },
    ],

    // Roulette Burlona
    roulette_spin_start: [
      { text: 'Rueda que rueda... a ver a qué agujero negro se van tus fichas hoy.', mood: 'smirk' },
      { text: '¡Hagan sus rezos, señores, que la bola no tiene oídos ni piedad!', mood: 'laughing' },
    ],
    roulette_ball_bouncing: [
      { text: 'Mírala saltar... pasando cerquita de tu número para reírse de ti.', mood: 'smirk' },
      { text: 'Salta que te salta... ¿ya empezaste a sudar frío en la frente?', mood: 'laughing' },
    ],
    roulette_win_number: [
      { text: '¡¿En serio le pegaste al pleno?! ¡Tienes que estar bromeando!', mood: 'impressed' },
      { text: '¡Pleno! No sé si tienes bola de cristal o un pacto con el diablo.', mood: 'smirk' },
    ],
    roulette_win_outside: [
      { text: 'Bueno, ganaste la mitad de una miseria. Algo es algo.', mood: 'smirk' },
    ],
    roulette_loss_color: [
      { text: '¿Apostaste al rojo y cayó negro? Siempre al revés de la vida.', mood: 'laughing' },
      { text: '¿Daltónico o con mala puntería? El color no te quiso hoy.', mood: 'smirk' },
    ],
    roulette_zero: [
      { text: '¡CERO VERDE! ¡Directo a la buchaca del casino! Gracias por cooperar.', mood: 'laughing' },
      { text: '¡El verde de la casa! Nadie se escapa del cero, bebé.', mood: 'smirk' },
    ],

    // Conquian Burlona
    conquian_draw: [
      { text: 'Robando del monte... a ver si no te sale un sapo.', mood: 'smirk' },
    ],
    conquian_forced_meld: [
      { text: '¡Te metieron carta! Eso te pasa por no mirar la mesa, genio.', mood: 'laughing' },
      { text: '¡Toma castigo! Ahora te quedas atorado con esa carta que no querías ni de broma.', mood: 'smirk' },
      { text: '¡Te ensartaron carta obligada! Qué descuido tan sabroso.', mood: 'laughing' },
    ],
    conquian_win_9_cards: [
      { text: '¿Bajaste las 9 cartas? Admite que no sabías ni lo que hacías.', mood: 'impressed' },
      { text: '¡Conquián! Bueno, hasta un ciego encuentra una nuez de vez en cuando.', mood: 'smirk' },
    ],
    conquian_discard: [
      { text: '¿Esa porquería tiraste? A ver si el rival no te hace conquián en la cara con ella.', mood: 'smirk' },
      { text: 'Tiraste justo lo que no debías... qué regalo tan bonito.', mood: 'laughing' },
    ],
    conquian_meld: [
      { text: 'Bajando tercias... no te confíes que todavía te faltan cartas para llorar.', mood: 'smirk' },
    ],
  },

  // 3. DESAFÍANTE: Intimidating, pushes player to bet higher, doubts player's courage
  desafiante: {
    game_start: [
      { text: 'Espero que tengas agallas, aquí no aceptamos jugadores cobardes.', mood: 'challenging' },
      { text: 'Bienvenido a la mesa de los grandes. Demuestra de qué estás hecho.', mood: 'challenging' },
      { text: 'Si no estás listo para arriesgarlo todo, retírate de una vez antes de pasar vergüenza.', mood: 'smirk' },
    ],
    bet_placed: [
      { text: '¿Solo eso arriesgas? Pensé que eras un verdadero apostador.', mood: 'challenging' },
      { text: 'Esa fichita no impresiona a nadie. Ponle verdadero fuego a la mesa.', mood: 'challenging' },
      { text: 'Si juegas con timidez, el casino se come tu dinero de un bocado.', mood: 'smirk' },
    ],
    low_bet: [
      { text: '¿Solo eso apostarás? Pensé que eras valiente.', mood: 'challenging' },
      { text: '¿Le tienes miedo al éxito o a perder tus centavitos?', mood: 'challenging' },
      { text: 'Esta mesa es para tiburones, no para pececillos con miedo.', mood: 'smirk' },
    ],
    high_bet: [
      { text: '¡Eso es hablar mi idioma! Ahora sí tenemos una partida de hombres de verdad.', mood: 'challenging' },
      { text: '¡Gran jugada! Así se apuesta en una mesa de respeto. Te sostengo la mirada.', mood: 'impressed' },
      { text: 'Fuego contra fuego. Si vas a morir, que sea en el campo de batalla.', mood: 'challenging' },
    ],
    player_win: [
      { text: 'Te llevas esta mano, pero el campeonato apenas comienza. Sube la apuesta.', mood: 'challenging' },
      { text: 'Buena estocada. Veamos si tienes agallas para dejar las ganancias sobre el paño.', mood: 'smirk' },
      { text: 'Reconozco un buen tiro cuando lo veo. Ahora defiéndelo como los grandes.', mood: 'impressed' },
    ],
    player_loss: [
      { text: 'El casino cobra su tributo. Si te dolió, mejor vete a las maquinitas.', mood: 'challenging' },
      { text: 'Una derrota más a tu cuenta. ¿Te vas a achicar o vas a doblar la apuesta?', mood: 'smirk' },
      { text: 'El dolor enseña al que quiere aprender. Levanta la cabeza y apuesta fuerte.', mood: 'challenging' },
    ],
    out_of_chips: [
      { text: '¿Te rendirás tan fácil? Ve un anuncio y regresa si todavía tienes orgullo.', mood: 'challenging' },
      { text: '¿Ya no te queda un peso? Demuéstrame que puedes levantarte del suelo.', mood: 'smirk' },
      { text: '¿Eso fue todo lo que aguantaste? Mira un video patrocinado si quieres tu revancha de honor.', mood: 'challenging' },
    ],
    idle: [
      { text: 'La indecisión es el primer síntoma de los perdedores. Muévete.', mood: 'challenging' },
      { text: '¿Cuánto tiempo más vas a dudar? Apuesta o cede el asiento.', mood: 'thinking' },
    ],

    // Blackjack Desafiante
    bj_deal: [
      { text: 'Mira bien tus cartas. ¿Atacas a la banca o te achicas?', mood: 'challenging' },
      { text: 'El crupier muestra su carta. ¿Asustado de lo que oculta mi mano?', mood: 'smirk' },
    ],
    bj_hit_risky: [
      { text: '¡Te gusta vivir al filo de la navaja! Si no te pasas, te ganas mi respeto.', mood: 'challenging' },
      { text: '¡Agallas no te faltan! Veremos si la baraja te premia o te pulveriza.', mood: 'impressed' },
      { text: 'Arriesgas el cuello con ese total... me agrada tu estilo suicida.', mood: 'smirk' },
    ],
    bj_stand: [
      { text: 'Te plantas... Veamos si tu total aguanta el empuje demoledor de la casa.', mood: 'challenging' },
      { text: 'Una postura defensiva. Veremos si resistes mi carta oculta.', mood: 'thinking' },
    ],
    bj_double: [
      { text: '¡Eso es tener sangre en las venas! ¡Una sola carta decide tu destino!', mood: 'challenging' },
      { text: '¡Todo o nada! Doblas la apuesta como los verdaderos gladiadores.', mood: 'impressed' },
    ],
    bj_split: [
      { text: 'Dos frentes de batalla abiertos. No parpadees o te aplasto en ambas.', mood: 'challenging' },
    ],
    bj_bust: [
      { text: 'La avaricia rompe el saco. Te pasaste por ambicioso.', mood: 'smirk' },
      { text: 'Caíste en la trampa. La próxima vez mide tu fuerza antes de lanzarte.', mood: 'challenging' },
    ],
    bj_dealer_bust: [
      { text: 'Me pasé esta vez... pero la revancha viene en camino, no cantes victoria todavía.', mood: 'thinking' },
      { text: 'Te salvaste por un pelo. La casa nunca olvida una derrota.', mood: 'challenging' },
    ],
    bj_dealer_blackjack: [
      { text: '¡Blackjack implacable! Así juega el dueño de la mesa.', mood: 'challenging' },
      { text: 'La casa es insuperable hoy. Ríndete o duplica tu apuesta si tienes honor.', mood: 'smirk' },
    ],
    bj_player_blackjack: [
      { text: '¡Golpe maestro! Bien jugado, te ganaste ese pago 3 a 2 con todas las de la ley.', mood: 'impressed' },
      { text: '¡Eso es un 21 con clase! Reconozco un golpe contundente.', mood: 'challenging' },
    ],
    bj_push: [
      { text: 'Empate de titanes. Nadie sangra en este asalto.', mood: 'challenging' },
    ],

    // Poker Desafiante
    poker_preflop_raise: [
      { text: '¿Subes la parada? Te acompaño, no me intimidas en lo absoluto.', mood: 'challenging' },
      { text: 'Sube todo lo que quieras, no vas a comprar este pozo tan barato.', mood: 'smirk' },
    ],
    poker_flop: [
      { text: 'El flop está servido. Aquí es donde se separan los hombres de los niños.', mood: 'challenging' },
    ],
    poker_turn: [
      { text: 'El turn aprieta el tornillo. ¿Sostienes tu apuesta?', mood: 'thinking' },
    ],
    poker_river_bluff: [
      { text: '¿Tratas de robarme el pozo en el river? Más vale que tengas un monstruo en mano.', mood: 'challenging' },
      { text: '¡Vaya apuesta en el river! ¿Tienes el valor o es puro teatro barato?', mood: 'smirk' },
    ],
    poker_win: [
      { text: 'Bien ganado ese pozo. Supiste presionar cuando debías.', mood: 'impressed' },
      { text: 'Respeto para esa mano. Pero la siguiente ronda no será tan sencilla.', mood: 'challenging' },
    ],
    poker_bad_beat: [
      { text: 'El poker es un deporte despiadado. Agáchate o levántate para el siguiente round.', mood: 'challenging' },
      { text: 'Un golpe al mentón. Demuestra que puedes soportar el castigo sin quebrarte.', mood: 'thinking' },
    ],
    poker_fold: [
      { text: '¿Huyendo tan rápido? El poker premia a los que arriesgan, no a los que escapan.', mood: 'challenging' },
      { text: 'Te salvaste de una masacre, pero perdiste tu orgullo en el camino.', mood: 'smirk' },
    ],

    // Roulette Desafiante
    roulette_spin_start: [
      { text: '¡No va más! Veamos si el destino respeta tu apuesta o te pasa por encima.', mood: 'challenging' },
      { text: 'La rueda de la fortuna gira. ¿Pusiste todo donde debías o dudaste al final?', mood: 'thinking' },
    ],
    roulette_ball_bouncing: [
      { text: 'El momento de la verdad se acerca. Nada de pestañear.', mood: 'challenging' },
      { text: 'Buscando casilla. Aquí es donde se define quién manda en esta sala.', mood: 'impressed' },
    ],
    roulette_win_number: [
      { text: '¡PLENO directo! 35 a 1. Eso requiere agallas titánicas. ¡Mis respetos!', mood: 'impressed' },
      { text: '¡Impresionante golpe a la ruleta! Has hecho sangrar al casino como un guerrero.', mood: 'challenging' },
    ],
    roulette_win_outside: [
      { text: 'Cobras la suerte sencilla. Para la próxima, ve por un número pleno.', mood: 'challenging' },
    ],
    roulette_loss_color: [
      { text: 'El color te traicionó. ¿Duplicas la apuesta o te congelas del miedo?', mood: 'challenging' },
      { text: 'Una pérdida menor. Los verdaderos apostadores contraatacan en la siguiente.', mood: 'smirk' },
    ],
    roulette_zero: [
      { text: 'El cero manda en esta mesa. Una lección de disciplina para todos.', mood: 'challenging' },
      { text: 'Golpe verde del casino. Hay que saber respetar la ventaja de la casa.', mood: 'thinking' },
    ],

    // Conquian Desafiante
    conquian_draw: [
      { text: 'Carta en mano. Toma tu decisión sin titubear.', mood: 'challenging' },
    ],
    conquian_forced_meld: [
      { text: '¡Te metieron carta! Te acorralaron en tu propio juego, sal de esta si puedes.', mood: 'challenging' },
      { text: 'Castigo directo al pecho. Veamos cómo desarmas tu mano ahora bajo presión.', mood: 'smirk' },
    ],
    conquian_win_9_cards: [
      { text: '¡Conquián limpio de 9 cartas! Una cátedra de juego sobre el tapete.', mood: 'impressed' },
      { text: '¡Impresionante cierre de 9 cartas! Te reconozco como maestro de la baraja española.', mood: 'challenging' },
    ],
    conquian_discard: [
      { text: 'Buen descarte. No le regales ni un milímetro de ventaja a tu rival.', mood: 'challenging' },
      { text: 'Tiras la carnada al pozo. Veremos quién pica con ese descarte.', mood: 'smirk' },
    ],
    conquian_meld: [
      { text: 'Buena bajada. Estás a solo unas cartas de coronarte. No bajes la guardia.', mood: 'challenging' },
    ],
  },

  // 4. AMIGABLE: Encouraging, warm, compliments good plays, supportive
  amigable: {
    game_start: [
      { text: '¡Qué gusto tenerte en la mesa! Hoy tengo un gran presentimiento para ti.', mood: 'celebrating' },
      { text: '¡Bienvenido! Relájate, diviértete y que caigan muchos premios en esta sesión.', mood: 'neutral' },
      { text: '¡Hola! Estoy aquí para acompañarte, ¡vamos a pasar un rato increíble!', mood: 'celebrating' },
    ],
    bet_placed: [
      { text: '¡Buena decisión! Apuesta bien pensada.', mood: 'neutral' },
      { text: '¡Excelente monto! Te deseo la mejor de las suertes en este tiro.', mood: 'celebrating' },
      { text: 'Fichas en juego, ¡vamos juntos por una buena victoria!', mood: 'impressed' },
    ],
    low_bet: [
      { text: 'Paso a paso se llega lejos, la paciencia es una gran virtud en el juego.', mood: 'neutral' },
      { text: 'Buena gestión de banca, con calma y prudencia se construyen las rachas.', mood: 'thinking' },
      { text: 'Excelente forma de cuidar tu capital mientras calientas motores.', mood: 'neutral' },
    ],
    high_bet: [
      { text: '¡Impresionante apuesta! Respira hondo, ¡estoy contigo con toda la buena vibra!', mood: 'impressed' },
      { text: '¡Qué emoción! Una jugada grande para un momento inolvidable.', mood: 'celebrating' },
      { text: '¡Vamos por ese pozo gigante! Te mereces ese premio.', mood: 'impressed' },
    ],
    player_win: [
      { text: '¡SIII! ¡Felicidades! ¡Qué gran victoria te acabas de llevar!', mood: 'celebrating' },
      { text: '¡Te lo dije! Tienes una intuición maravillosa, ¡bien ganado!', mood: 'celebrating' },
      { text: '¡Qué alegría me da verte ganar! A disfrutar ese premio.', mood: 'impressed' },
    ],
    player_loss: [
      { text: 'No te preocupes por esa mano, la siguiente racha buena es completamente tuya.', mood: 'neutral' },
      { text: '¡Ánimo! El juego da revanchas a cada minuto, respira y volvemos.', mood: 'thinking' },
      { text: 'A veces la carta no colabora, pero jugaste con gran cabeza.', mood: 'neutral' },
    ],
    out_of_chips: [
      { text: '¡Oh no! No te desanimes, hasta los mejores campeones caen. Ve un breve anuncio para recibir fichas gratis.', mood: 'neutral' },
      { text: '¡No pasa nada, amigo! Una recarga viendo un anuncio y volvemos a la acción con toda la actitud.', mood: 'celebrating' },
      { text: 'Las rachas van y vienen. Mira un anuncio y continuemos divirtiéndonos juntos.', mood: 'neutral' },
    ],
    idle: [
      { text: 'Tómate el tiempo que necesites, aquí no hay prisas para ti.', mood: 'neutral' },
      { text: 'Piensa tranquilo tu mejor movimiento, confío en tu criterio.', mood: 'thinking' },
    ],

    // Blackjack Amigable
    bj_deal: [
      { text: 'Aquí tienes tus cartas, ¡te deseo un gran total desde el reparto!', mood: 'celebrating' },
      { text: 'Mano en marcha, ¡confía en tu instinto y vamos por ese 21!', mood: 'neutral' },
    ],
    bj_hit_risky: [
      { text: '¡Uyy qué jugada tan atrevida! ¡Cruzo los dedos por ti con fuerza!', mood: 'impressed' },
      { text: '¡Corazón de león! Ojalá venga una carta bajita como un 4 o un 5.', mood: 'thinking' },
      { text: '¡Valiente decisión! Que la baraja premie tu entusiasmo.', mood: 'celebrating' },
    ],
    bj_stand: [
      { text: 'Plantado inteligentemente. ¡Veamos qué saca el crupier!', mood: 'neutral' },
      { text: 'Muy buena decisión. ¡A defender esos valiosos puntos!', mood: 'celebrating' },
    ],
    bj_double: [
      { text: '¡Buena oportunidad para doblar! ¡Que venga esa carta dorada!', mood: 'celebrating' },
      { text: '¡Qué gran momento para maximizar la ganancia! ¡Vamos!', mood: 'impressed' },
    ],
    bj_split: [
      { text: '¡Doble oportunidad de ganar! Vamos a jugar ambas con toda la concentración.', mood: 'celebrating' },
    ],
    bj_bust: [
      { text: '¡Qué lástima! Estuvo tan cerca... ¡La próxima mano saldrá mucho mejor!', mood: 'neutral' },
      { text: 'Uyy, esa carta extra fue traicionera. ¡No bajes los brazos!', mood: 'thinking' },
    ],
    bj_dealer_bust: [
      { text: '¡SIII! ¡El crupier se pasó! ¡Excelente cobro, felicidades!', mood: 'celebrating' },
      { text: '¡Victoria muy merecida! Gran paciencia demostrada en la mesa.', mood: 'impressed' },
    ],
    bj_dealer_blackjack: [
      { text: '¡Oh vaya, qué mala suerte! Un Blackjack natural del crupier... ¡No te desanimes!', mood: 'thinking' },
      { text: 'Una jugada fortuita de la casa. ¡La siguiente nos la cobramos!', mood: 'neutral' },
    ],
    bj_player_blackjack: [
      { text: '¡¡BLACKJACK!! ¡Increíble! ¡3 a 2 directo a tu bolsillo! ¡Bien jugado!', mood: 'celebrating' },
      { text: '¡Maravilloso 21! Así se juega con estilo y alegría.', mood: 'impressed' },
    ],
    bj_push: [
      { text: '¡Empatamos! Tus fichas están a salvo para el siguiente intento.', mood: 'neutral' },
    ],

    // Poker Amigable
    poker_preflop_raise: [
      { text: '¡Esa es una jugada con determinación! Marcando el territorio temprano.', mood: 'celebrating' },
      { text: '¡Excelente agresividad bien calculada pre-flop!', mood: 'impressed' },
    ],
    poker_flop: [
      { text: 'Tres cartas al centro. ¡Espero que hayan conectado con tu mano!', mood: 'neutral' },
    ],
    poker_turn: [
      { text: 'Carta del turn. Se pone muy emocionante esta mano.', mood: 'thinking' },
    ],
    poker_river_bluff: [
      { text: '¡Jugada de infarto en el river! Vaya nervios de acero los tuyos.', mood: 'impressed' },
      { text: 'Presión al máximo en la última carta, ¡qué gran emoción!', mood: 'celebrating' },
    ],
    poker_win: [
      { text: '¡QUÉ MANAZA! ¡Te llevas todo el pozo, qué orgullo!', mood: 'celebrating' },
      { text: '¡Lectura perfecta de la mesa! Te mereces cada centavo de ese bote.', mood: 'impressed' },
    ],
    poker_bad_beat: [
      { text: '¡Ay qué dolor de river! Jugaste impecable, fue solo una carta imposible. ¡Cabeza arriba!', mood: 'thinking' },
      { text: 'El azar a veces es caprichoso, pero tu estrategia fue la correcta. ¡Gran jugada de todos modos!', mood: 'neutral' },
    ],
    poker_fold: [
      { text: 'Saber retirarse a tiempo es la mayor muestra de inteligencia en el poker. Muy bien pensado.', mood: 'neutral' },
      { text: 'Cuidar tus fichas para una mano mejor es de verdaderos profesionales.', mood: 'thinking' },
    ],

    // Roulette Amigable
    roulette_spin_start: [
      { text: '¡Mucha suerte! Que la pelotita caiga exactamente donde soñaste.', mood: 'celebrating' },
      { text: '¡No va más! La magia de la ruleta está en marcha, ¡vamos por el premio!', mood: 'neutral' },
    ],
    roulette_ball_bouncing: [
      { text: '¡Ahí va desacelerando! ¡Vamos, quédate en el nuestro!', mood: 'impressed' },
      { text: '¡Qué emoción cómo rebota! Todos los ojos en el cilindro.', mood: 'thinking' },
    ],
    roulette_win_number: [
      { text: '¡¡PLENO AL NÚMERO!! ¡Increíble acierto! ¡Un pago 35 a 1 gigante para ti!', mood: 'celebrating' },
      { text: '¡Qué puntería tan magistral! ¡Festejemos este súper premio!', mood: 'impressed' },
    ],
    roulette_win_outside: [
      { text: '¡Cobro asegurado! Sumando fichas a la bolsa.', mood: 'celebrating' },
    ],
    roulette_loss_color: [
      { text: 'Estuvo cerquísima, ¡el color siempre da revancha enseguida!', mood: 'neutral' },
      { text: 'No pasa nada, una vueltita más y recuperamos terreno.', mood: 'thinking' },
    ],
    roulette_zero: [
      { text: '¡El travieso cero verde! Ni hablar, es el comodín de la mesa. ¡A por la siguiente!', mood: 'thinking' },
    ],

    // Conquian Amigable
    conquian_draw: [
      { text: 'Robando carta. Ojalá encaje perfecto en tus combinaciones.', mood: 'thinking' },
    ],
    conquian_forced_meld: [
      { text: '¡Uyy te metieron carta obligada! No te preocupes, aún puedes reorganizar la corrida.', mood: 'thinking' },
      { text: 'Jugada estratégica del rival. ¡Mucha concentración para recomponer, tú puedes!', mood: 'neutral' },
    ],
    conquian_win_9_cards: [
      { text: '¡¡CONQUIÁN!! ¡Las 9 cartas completitas! ¡Qué maestría y qué victoria tan brillante!', mood: 'celebrating' },
      { text: '¡Nueve cartas cerradas! Una partida impecable de baraja española, ¡felicidades!', mood: 'impressed' },
    ],
    conquian_discard: [
      { text: 'Descarte seguro. Mantén tus tercias bien protegidas.', mood: 'neutral' },
      { text: 'Buena carta al pozo, cuidando no alimentar la mano contraria.', mood: 'thinking' },
    ],
    conquian_meld: [
      { text: '¡Hermosa combinación! Cada vez más cerca de completar las 9 cartas.', mood: 'celebrating' },
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
 * Returns speech text, mood ('smirk' | 'laughing' | 'challenging' | 'impressed' | 'thinking' | 'celebrating' | 'neutral')
 * and sound pitch.
 */
export function getCrupierDialogue(
  _game: GameType | 'general',
  event: string,
  context?: CrupierContext,
  personality: PersonalityType = 'neutral'
): CrupierDialogueResult {
  const pConfig = PERSONALITY_CONFIGS[personality] || PERSONALITY_CONFIGS.neutral;
  const pDialogues = DIALOGUE_DB[personality] || DIALOGUE_DB.neutral;

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

  // Fallback to neutral personality if specific personality misses event
  if (!candidates || candidates.length === 0) {
    candidates = DIALOGUE_DB.neutral[resolvedEvent] || DIALOGUE_DB.neutral[event];
  }

  // Global fallback
  if (!candidates || candidates.length === 0) {
    candidates = [
      { text: 'La mesa sigue en juego. Mucha suerte.', mood: pConfig.avatarMood },
    ];
  }

  // Pick random dialogue from candidates
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  const interpolatedText = interpolateDialogue(picked.text, context);

  // Pitch calculation with slight random jitter for human-like vocal inflection
  const pitchJitter = (Math.random() - 0.5) * 20;
  const offset = picked.pitchOffset || 0;
  const soundPitch = Math.round(pConfig.basePitch + offset + pitchJitter);

  // Compute recommended duration based on character length (~60ms per char, min 2500ms, max 6000ms)
  const durationMs = Math.min(6500, Math.max(2600, interpolatedText.length * 65));

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
  return PERSONALITY_CONFIGS[personality] || PERSONALITY_CONFIGS.neutral;
}

/**
 * List of all personalities with metadata
 */
export const PERSONALITY_LIST: PersonalityConfig[] = Object.values(PERSONALITY_CONFIGS);
