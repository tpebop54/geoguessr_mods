/**
 * Quotes and facts and whatever.
 */

const QUOTES = { 

    inspirational: [
        `It is in falling short of your own goals that you will surpass those who exceed theirs. — Tokugawa Ieyasu`,
        `If you love life, do not waste time- for time is what life is made up of — Bruce Lee`,
        `Don't let the fear of the time it will take to accomplish something stand in the way of doing it. The time will pass anyway... — Earl Nightingale`,
        `Spend so much time on the improvement of yourself that you have no time to criticize others — Christian Larson`,
        `This too shall pass. — Unknown`,
        `No one can make you feel inferior without your consent — Eleanor Roosevelt`,
        `Never interrupt your enemy when he is making a mistake. — Napoleon Bonaparte`,
        `The magic you are looking for is in the work you are avoiding — Unknown`,
        `The grass is greenest where you water it — Unknown`,
        `People fear what they don't understand and hate what they can't conquer — Andrew Smith`,
        `Be who you needed when you were younger. — Unknown`,
        `A ship in harbor is safe, but that is not what ships are built for. — John A. Shedd`,
        `There is no hopeless situation, only hopeless people. — Atatürk`,
        `And those who were seen dancing were thought to be insane by those who could not hear the music. — Friedrich Nietzsche`,
        `There are no regrets in life, just lessons. — Jennifer Aniston`,
        `You must be the change you wish to see in the world. — Mahatma Gandhi`,
        `Don’t count the days, make the days count. — Muhammad Ali`,
        `I have not failed. I've just found 10,000 ways that won't work. — Thomas Edison`,
        `Don’t watch the clock. Do what it does. Keep going. — Sam Levenson`,
        `The best way to predict the future is to create it. — Peter Drucker`,
        `Do not go where the path may lead, go instead where there is no path and leave a trail. — Ralph Waldo Emerson`,
        `Those who mind don't matter, those who matter don't mind. — Dr. Seuss`,
        `Never stop never stopping.`,
    ],

    heavy: [
        `This thing that we call failure is not the falling down, but the staying down. — Mary Pickford`,
        `The soul would have no rainbow had the eyes no tears. — John Vance Cheney`,
        `The pain I feel now is the happiness I had before. That's the deal. — C.S. Lewis`,
        `I feel within me a peace above all earthly dignities, a still and quiet consciences. — William Shakespeare`,
        `You cannot believe now that you'll ever feel better. But this is not true. You are sure to be happy again. Knowing this, truly believing it, will make you less miserable now. — Abraham Lincoln`,
        `Do not stand at my grave and cry, I am not there, I did not die. — Mary Frye`,
        `To live is to suffer. To survive is to find meaning in the suffering. — Friedrich Nietzsche`,
        `Of all sad words of tongue or pen, the saddest are these, "It might have been." — John Greenleaf Whittier`,
        `If you try to please audiences, uncritically accepting their tastes, it can only mean that you have no respect for them. — Andrei Tarkovsky`,
        `In the end… We only regret the chances we didn’t take. — Lewis Carroll`,
        `There’s no feeling more intense than starting over. Starting over is harder than starting up. — Bennett Foddy`,
        `Imaginary mountains build themselves from our efforts to climb them, and it's our repeated attempts to reach the summit that turns those mountains into something real. — Bennett Foddy`,
        `Be yourself. Everyone else is already taken. — Oscar Wilde`,
        `Whether you think you can or you think you can’t, you’re right. — Henry Ford`,
        `The only true wisdom is in knowing you know nothing. — Socrates`,
        `Painting is silent poetry, and poetry is painting that speaks. — Plutarch`,
        `Muddy water is best cleared by leaving it alone. — Alan Watts`,
        `Do not go gentle into that good night. Old age should burn and rave at close of day. Rage, rage against the dying of the light. — Dylan Thomas`,
        `You can be mad as a mad dog at the way things went. You could swear, and curse the fates. But when it comes to the end, you have to let go. — Benjamin Button`,
        `It's a funny thing about comin' home. Looks the same, smells the same, feels the same. You'll realize what's changed is you. — Benjamin Button`,
        `Do you consider your big toe to be your pointer toe or your thumb toe? — Tpebop`,
    ],

    media: [ // Funny, light-hearted, or from movies/TV/celebrities. Some of the heavy stuff is also from media, but they belong in the heavy section.
        `Don't hate the player. Hate the game. — Ice-T`,
        `That rug really tied the room together. — The Dude`,
        `If you don't know what you want, you end up with a lot you don't. — Tyler Durden`,
        `Do. Or do not. There is no try. — Yoda`,
        `Big Gulps, huh? Alright! Welp, see ya later! — Lloyd Christmas`,
        `You are tearing me apart, Lisa! — Johnny (Tommy Wiseau)`,
        `I'm Ron Burgundy? — Ron Burgundy`,
        `You're out of your element, Donny! — Walter Sobchak`,
        `I have had it with these [gosh darn] snakes on this [gosh darn] plane — Neville Flynn`,
        `Welcome to CostCo. I love you. — Unknown (2505)`,
        `Brawndo's got what plants crave. It's got electrolytes. — Secretary of State (2505)`,
        `So you're telling me there's a chance! — Lloyd Christmas`,
        `I am serious, and don't call me Shirley. — Steve McCroskey`,
        `What is this, a center for ants? ... The center has to be at least three times bigger than this. — Derek Zoolander`,
        `Did we just become best friends? YUP!! — Dale Doback, Brennan Huff`,
        `I said "A" "L" "B" "U" .... .... "QUERQUE" — Weird Al`,
        `Badgers? Badgers? We don't need no stinking badgers! — Raul Hernandez`,
        `Time to deliver a pizza ball! — Eric Andre`,
        `I don't know how to put this, but I'm kind of a big deal. — Ron Burgundy`,
    ],

    jokes: [
        `When birds fly in V-formation, one side is usually longer. Know why? That side has more birds on it.`,
        `I broke my leg in two places. My doctor told me to stop going to those places.`,
        `Why do birds fly south in the winter? Because it's too far to walk.`,
        `Orion's Belt is a massive waist of space.`,
        `Do your shoes have holes in them? No? Then how did you get your feet in them?`,
        `A magician was walking down the street. Then he turned into a grocery store.`,
        `Why do scuba divers fall backward off the boat? If they fell forward, they'd still be in the boat.`,
        `Did the old lady fall down the well because she didn't see that well, or that well because she didn't see the well?`,
        `In the vacuum of space, no one can hear you get mad at your GeoGuessr game.`,
    ],

    funFacts: [
        `Sloths can hold their breath longer than dolphins.`,
        `Koalas have fingerprints so similar to humans that they can confuse crime scene investigators.`,
        `The pistol shrimp snaps its claw so fast it creates a bubble hotter than the surface of the sun.`,
        `Dogs' nose prints are as unique as human fingerprints.`,
        `Sharks existed before trees.`,
        `Jupiter has the shortest day of any planet in our solar system.`,
        `There are more permutations of a deck of playing cards than stars in the obervable universe. Like, a lot more.`,
        `Earth would turn into a black hole if condensed into a 0.87cm radius.`,
        `Elephants have about 3 times as many neurons as humans.`,
        `Scientists simulated a fruit fly brain fully. This has 140k neurons (humans have 86 billion)`,
        `On average, Mercury is closer to Earth than Venus.`,
        `The Jamaican flag is the only country flag that does not contain red, white, or blue.`,
        `Nintendo was founded before the fall of the Ottoman Empire.`,
        `The fax machine was invented before the telephone.`,
        `The Titanic sank before the invention of sunscreen.`,
        `The first transatlantic telephone call was the same year that Winnie-the-Pooh was published (1926)`,
        `The first moon landing was 66 years after the first Wright brothers' flight of 12 seconds.`,
        `A cheap Casio watch or an Arduino Uno have the computing power of the first lunar lander. $10-$20.`,
        `The inventor of the glue used in Post-Its intended to make a very strong glue but accidentally made a very weak glue.`,
        `Popsicles were invented by an 11-year-old.`,
        `The plural of octopus has three accepted versions- octopuses, octopi, octopodes.`,
        `Lake Baikal holds 20% of Earth's liquid freshwater.`,
        `The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion of the metal.`,
        `Bananas are berries, but strawberries aren't.`,
        `A group of flamingos is called a flamboyance.`,
        `A group of owls is called a parliament.`,
        `A group of jellyfish is called a smack.`,
        `Broccoli, cauliflower, bok choy, turnip, cabbage, kale, and brussels sprouts all come from plants in the same genus`,
        `Michelin stars were originally given to restaurants to encourage people to drive more and buy more tires.`,
        `The longest place name in the world is 85 characters long and is in New Zealand (Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu).`,
    ],

};

function initQuotes() {
    window._QUOTES = QUOTES; // Make available globally
    return QUOTES;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuotes);
} else {
    initQuotes();
}