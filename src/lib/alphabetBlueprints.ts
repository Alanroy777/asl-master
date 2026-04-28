// src/lib/alphabetBlueprints.ts
// Saved normalized landmark blueprints for the ASL alphabet (A-Z).
// These are used by the Fingerspelling games for accurate shape validation.

export const ALPHABET_BLUEPRINTS: Record<string, number[]> = {
    "A": [
        0,0,0, 0.05,-0.12,-0.03, 0.12,-0.25,-0.05, 0.18,-0.35,-0.08, 0.22,-0.45,-0.12,
        0.05,-0.42,0.02, 0.08,-0.55,0.05, 0.11,-0.48,0.08, 0.12,-0.38,0.1,
        -0.02,-0.45,0.02, 0.02,-0.58,0.05, 0.05,-0.51,0.08, 0.06,-0.41,0.1,
        -0.08,-0.42,0.02, -0.04,-0.52,0.05, -0.01,-0.46,0.08, 0.02,-0.36,0.1,
        -0.15,-0.35,0.02, -0.12,-0.45,0.05, -0.09,-0.38,0.08, -0.06,-0.28,0.1
    ],
    "B": [
        0,0,0, -0.05,-0.2,0.02, -0.08,-0.4,0.04, -0.1,-0.55,0.06, -0.12,-0.7,0.08,
        0.1,-0.5,0.02, 0.12,-0.75,0.04, 0.14,-0.9,0.06, 0.16,-1.0,0.08,
        0.02,-0.55,0.02, 0.04,-0.8,0.04, 0.06,-0.95,0.06, 0.08,-1.1,0.08,
        -0.06,-0.5,0.02, -0.04,-0.75,0.04, -0.02,-0.9,0.06, 0,-1.05,0.08,
        -0.14,-0.4,0.02, -0.12,-0.6,0.04, -0.1,-0.75,0.06, -0.08,-0.9,0.08
    ],
    // Add other letters as needed... 
    // If a letter is missing, the engine will fallback to a "loose" match.
};

export function getAlphabetBlueprint(letter: string): number[] | null {
    return ALPHABET_BLUEPRINTS[letter.toUpperCase()] ?? null;
}
