/**
 * DEVELOPMENT SEED CONTENT — fictional writers and letters for local development and tests only.
 * Names and titles follow the design source (docs/harystyles/screens-*.jsx), unified per the
 * business brief §14 ("inconsistent seed names" → web-screen spellings). Never load in production.
 */
import type { Mood } from "../src/contracts/enums";

export const SEED_WRITERS = [
  { key: "ines", penName: "Ines Marlowe", email: "ines@harystyles.dev", bio: "I write at night, mostly about leaving.", location: "writes from Lisbon", hue: 25 },
  { key: "tomas", penName: "Tomás Vega", email: "tomas@harystyles.dev", bio: "Letters to the people I almost became.", location: "writes from Valparaíso", hue: 280 },
  { key: "saoirse", penName: "Saoirse Linn", email: "saoirse@harystyles.dev", bio: "Notes from the hours when sleep won't come.", location: "writes from Galway", hue: 200 },
  { key: "daniyar", penName: "Daniyar Ahn", email: "daniyar@harystyles.dev", bio: "Rivers, kettles, small weather.", location: "writes from Almaty", hue: 160 },
  { key: "marisol", penName: "Marisol Ortiz", email: "marisol@harystyles.dev", bio: "On loving people while they are leaving.", location: "writes from Oaxaca", hue: 10 },
  { key: "wren", penName: "Wren Adebayo", email: "wren@harystyles.dev", bio: "I keep a list of the light in other people's kitchens.", location: "writes from Leeds", hue: 120 },
] as const;

export type SeedWriterKey = (typeof SEED_WRITERS)[number]["key"];

export const SEED_STAFF = [
  { email: "curator@harystyles.dev", name: "Priya (curator)", roles: ["curator"] as const },
  { email: "admin@harystyles.dev", name: "Admin", roles: ["admin"] as const },
];
export const SEED_READERS = [
  { email: "maya@harystyles.dev", name: "Maya", moods: ["tender", "melancholy"] as Mood[] },
  { email: "tomas.reader@harystyles.dev", name: "Tomás R.", moods: ["still"] as Mood[] },
];

/** Paragraph pools per mood: each letter draws 5 paragraphs, so every letter clears 150 words. */
const P: Record<Mood, string[]> = {
  tender: [
    "There is a particular way you fold a towel, in thirds and then in half, and I have started doing it too without meaning to. I noticed this morning, standing in the small light of the bathroom. It is a ridiculous thing to love about a person. I love it anyway.",
    "My mother used to leave the hall light on until the last of us came home. Not because she was waiting up, she said, but because a dark house is a hard thing to walk into. I understand now that those were the same sentence.",
    "You asked me once what I would keep if the flat caught fire. I said the photographs, which was a lie. I would keep the chipped blue mug, because you held it every morning for three years and it still feels warm to me when it is empty.",
    "We are not good at saying it, the people in my family. We say drive safe. We say did you eat. We say text me when you get there. I have learned to hear the whole sentence underneath, the way you learn the shape of a room in the dark.",
    "Tonight the neighbour's child practised the same four bars of a song for an hour. Wrong, then nearly right, then wrong again. I did not mind. There is something tender about listening to someone become, one mistake at a time, through a thin wall.",
    "I kept the note you left on the fridge: back at six, there is soup. It is not a love letter. It is better than a love letter. It assumes I will still be here at six, and that I will be hungry, and that you will come home.",
    "If you are reading this late, I hope the room is warm. I hope someone has left a light on for you somewhere, even if it is only the small red one on the kettle. That counts. Small lights count. I am more sure of that than of most things.",
  ],
  restless: [
    "It is three in the morning and the fridge is humming a note I cannot name. I have rearranged the books twice. I have written four emails I will not send. There is a kind of awake that is not about sleep at all; it is about wanting to be somewhere else.",
    "Every April I want to move cities. It arrives like weather, this itch, the same week the first warm evening makes everyone stand outside the pubs. I look at train timetables the way some people look at old photographs. Departures. Departures. Departures.",
    "I cannot sit through a whole film any more. I keep opening tabs, a map of Porto, a flat I will never rent, a list of words that have no translation. I am looking for a door. I do not know yet which wall it is in.",
    "The trouble with being restless is that it looks like ambition from the outside. People say you are going places. I am not going places. I am pacing a corridor with the lights on, trying every handle, hoping one of them is unlocked.",
    "I walked until the streetlights changed colour, sodium orange giving way to the new white ones near the station. A fox crossed the road without looking at me. It knew where it was going. I followed it for a block, which tells you everything.",
    "My grandmother kept a packed suitcase under her bed for forty years. She never went anywhere. When we cleared the house we opened it: two dresses, a passport long expired, a bar of soap still in its paper. I think about that suitcase more than I should.",
    "Some nights the only cure is to write it all down, every half-plan and almost-leaving, until the page is full and the room is quiet again. This is one of those pages. Thank you for reading it. I feel a little more still already.",
  ],
  melancholy: [
    "On the day I left the city, the tram I took every morning came on time for the first time in years. It felt like being let go of gently. I sat by the window and watched the bakery, the pharmacy, the bench where we used to argue, slide away like slides in a dark room.",
    "There is a small grief in leaving a place that never knew you were there. The streets do not miss you. The baker does not wonder. And yet you carry the whole map of it inside you, every crooked step, every door that stuck in the rain.",
    "I found your handwriting in the margin of a library book. Not yours, of course; someone else who also underlined the sentence about evenings. For a moment the world felt less large. Then I returned the book, and it was large again.",
    "Blue hours are the ones between the end of work and the start of anything else. I spend too many of them at the window, watching the lit squares of other flats fill with other lives. It is not sadness exactly. It is the colour sadness becomes when it is tired.",
    "My father kept every birthday card he was ever given in a shoebox labelled taxes. I think he did not want anyone to know how much they mattered. When I opened it, the box smelled of his coat. I have not been able to throw the label away.",
    "Autumn here is not dramatic. The leaves do not blaze; they simply give up, one by one, onto the pavement. I find it more honest than the postcards. Most endings are like that, quiet and brown and walked over on the way to somewhere.",
    "If I could send one letter back in time, it would be to the version of me on that platform, holding a ticket too tightly. I would tell her the city will keep a little of her. I would tell her that is not the same as losing it.",
  ],
  still: [
    "The river does not hurry, even when it floods. I sat on the bank this morning while a heron stood in the shallows for twenty minutes, not moving at all. I have never seen anything so patient. I left feeling that I had been taught something without words.",
    "A morning, a kettle, the cold. The window fogs from the inside and I draw nothing on it. I wait for the water. This is the whole of the ritual, and I have come to love it more than any of the busy, important things that come after.",
    "In the library at closing time there is a minute when the lights dim but nobody has left yet. Everyone keeps reading. Nobody speaks. I think it may be the most peaceful minute in the city, and I try to be there for it most Thursdays.",
    "Snow fell overnight without a sound. When I opened the curtains the street had been edited down to its outlines: the lamppost, the bench, the line of the roofs. I stood there until my tea went cold, which I did not mind at all.",
    "My grandfather mended watches. He said the trick was to stop trying to be quick, because the watch would always be quicker than you. He worked by the window in the afternoons, very still, and I would sit beside him and listen to fifty clocks agree.",
    "Stillness is not the same as emptiness. The pond in the park looks empty from the path, but kneel down and it is full of small, slow lives: water boatmen, a newt, the stems of lilies going down into the dark. Most rich things are like that.",
    "Tonight I am not going to fix anything. I am going to sit with the lamp on and let the evening be exactly as long as it is. If you are reading this, maybe you could do the same. Just for a little while. The world will keep.",
  ],
  burning: [
    "I want to tell you about the first time I heard a whole choir hold one note until the building seemed to lean. I was nineteen and broke and certain of nothing, and for eleven seconds I was certain of everything. I have been chasing those eleven seconds since.",
    "Loving someone who is leaving is like holding a match to see the room. You know it will go out. You look harder because of it. You memorise the corners, the colour of the walls, the way their hand rests on the table while they talk about the airport.",
    "The market at noon is a riot of chillies and marigolds and men shouting prices like poetry. I bought too much fruit again. I cannot help it. Some days the world is so loud and so bright that the only answer is to carry home more than you can eat.",
    "I danced in the kitchen last night with the radio turned up and the windows open, and someone across the courtyard started dancing too. We never waved. We never needed to. For one song we were the only two people alive in the whole city.",
    "There is a heat that is not anger. It is the thing that gets you out of bed before the alarm because you have an idea and it will not wait. I had one of those this week. I am writing this with flour on my hands and paint under my nails.",
    "My aunt said the trick to a long life is to love one thing so much it embarrasses you. Hers was tango. Mine, it turns out, is the ten minutes before a thunderstorm, when the whole sky holds its breath and the street smells of hot stone.",
    "If anything in this letter catches, let it. Let it burn a little. We spend so long being careful with ourselves. Tonight, be careless with your joy. Leave it lying around where other people can find it and warm their hands.",
  ],
  untethered: [
    "In airports I feel like a letter between addresses. Not lost, exactly. Just in transit, belonging to no one for a while. I like the hum of the moving walkway and the announcements in three languages, none of them for me.",
    "I have lived in seven flats in nine years. I know how to pack a kitchen in an hour and where to put the kettle first. People ask where home is and I give them a different answer each time, and each time it is true.",
    "On the night ferry the sea and the sky are the same colour, and the only way to know which is which is the lights of a far boat. I stood on deck until I could not feel my hands. I was nobody, going nowhere, and it was lovely.",
    "Sometimes I forget which time zone my body is in. I wake at four and the light is wrong and for one long second I do not know the country. Then a car passes, a dog barks in a familiar language, and the world puts its weight back on me.",
    "My friend sends voice notes from the other side of the world, always at the wrong hour. I listen to them on buses, in queues, half asleep. Her voice arrives like a balloon that slipped someone's hand: light, a little far, still unmistakably hers.",
    "There is a freedom in having no plans that most people mistake for loneliness. Today I followed a street because I liked its name. It led to a small square with a fountain and an old man feeding pigeons. I stayed an hour. No one needed me anywhere.",
    "If you feel unanchored tonight, maybe you are not lost. Maybe you are drifting the way a seed drifts, which is to say on purpose, towards some patch of ground you have not seen yet. I hope it is soft. I hope it gets the morning sun.",
  ],
};

const TITLES: Record<SeedWriterKey, Record<Mood, string>> = {
  ines: {
    tender: "A small inventory of ordinary love",
    restless: "Every April I want to leave",
    melancholy: "On the small grief of leaving a city",
    still: "What the tram knew",
    burning: "The eleven seconds",
    untethered: "Seven flats in nine years",
  },
  tomas: {
    tender: "A letter to the version of me who stayed",
    restless: "Departures board",
    melancholy: "Handwriting in a borrowed book",
    still: "My grandfather's clocks",
    burning: "On loving someone who is leaving",
    untethered: "Wrong time zone",
  },
  saoirse: {
    tender: "Letters my mother never sent",
    restless: "Notes from a sleepless April",
    melancholy: "Blue hours",
    still: "Closing time at the library",
    burning: "Ten minutes before the storm",
    untethered: "The night ferry",
  },
  daniyar: {
    tender: "Back at six, there is soup",
    restless: "Following the fox",
    melancholy: "The shoebox labelled taxes",
    still: "What the river kept",
    burning: "Noon market",
    untethered: "Voice notes at the wrong hour",
  },
  marisol: {
    tender: "The light in the kitchen at 4am",
    restless: "A packed suitcase under the bed",
    melancholy: "Autumn, honestly",
    still: "Snow, edited",
    burning: "Loving someone who is leaving",
    untethered: "A street with a good name",
  },
  wren: {
    tender: "Four bars through a thin wall",
    restless: "Trying every handle",
    melancholy: "To the girl on the platform",
    still: "A morning, a kettle, the cold",
    burning: "Dancing across the courtyard",
    untethered: "A seed, drifting",
  },
};

const SUBTITLES: Partial<Record<string, string>> = {
  "On the small grief of leaving a city": "A small inventory of what was left behind, and what came along by mistake.",
  "What the river kept": "On patience, herons, and the long way water takes.",
  "Notes from a sleepless April": "Three in the morning, and the fridge is humming.",
};

export type SeedLetter = { writer: SeedWriterKey; mood: Mood; title: string; subtitle: string | null; paragraphs: string[]; visibility: "public" | "patron"; daysAgo: number };

export function seedLetters(): SeedLetter[] {
  const moods = Object.keys(P) as Mood[];
  const out: SeedLetter[] = [];
  SEED_WRITERS.forEach((w, wi) => {
    moods.forEach((m, mi) => {
      const pool = P[m];
      const paragraphs = Array.from({ length: 5 }, (_, k) => pool[(wi + k * 2 + mi) % pool.length]!);
      const title = TITLES[w.key][m];
      out.push({ writer: w.key, mood: m, title, subtitle: SUBTITLES[title] ?? null, paragraphs, visibility: "public", daysAgo: 3 + ((wi * 6 + mi) % 40) });
    });
  });
  // Patron letters (preview gating, INV-01) — Ines and Tomás.
  out.push({
    writer: "ines",
    mood: "tender",
    title: "I don't know how to end this letter",
    subtitle: "For the people who keep the lamp lit.",
    paragraphs: [P.tender[6]!, P.melancholy[6]!, P.still[6]!, P.tender[2]!, P.burning[6]!, P.untethered[6]!],
    visibility: "patron",
    daysAgo: 1,
  });
  out.push({
    writer: "tomas",
    mood: "melancholy",
    title: "What I didn't say at the station",
    subtitle: null,
    paragraphs: [P.melancholy[0]!, P.melancholy[3]!, P.tender[1]!, P.melancholy[5]!, P.still[1]!],
    visibility: "patron",
    daysAgo: 2,
  });
  // A fresh letter for personal slots (followed writer, last 48h).
  out.push({ writer: "saoirse", mood: "tender", title: "The hall light", subtitle: null, paragraphs: [P.tender[1]!, P.tender[3]!, P.tender[0]!, P.still[5]!, P.tender[6]!], visibility: "public", daysAgo: 0 });
  return out;
}

export const SEED_NOTEBOOKS: { writer: SeedWriterKey; title: string; description: string; mood: Mood; letterTitles: string[] }[] = [
  {
    writer: "ines",
    title: "Letters from a leaving city",
    description: "On Lisbon, on departure, on the small geographies of loss.",
    mood: "melancholy",
    letterTitles: ["On the small grief of leaving a city", "What the tram knew", "Every April I want to leave"],
  },
  {
    writer: "ines",
    title: "On loving slowly",
    description: "Twelve letters about the kind of love that doesn't announce itself.",
    mood: "tender",
    letterTitles: ["A small inventory of ordinary love", "I don't know how to end this letter"],
  },
  { writer: "saoirse", title: "Sleepless April", description: "Notes from a month of bad sleep and good light.", mood: "restless", letterTitles: ["Notes from a sleepless April", "Blue hours"] },
];
