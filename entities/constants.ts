// Entity types
export const ENTITY_TYPES = {
    SKY: 0, // ants cannot access SKY
    AIR: 1,
    DIRT: 2,
    ANT: 3,
    CRUST: 4,    // ants cannot dig through CRUST
    ERROR: 99
};

// ASCII characters for each entity type
export const ENTITY_CHARS = {
    [ENTITY_TYPES.SKY]: ' ',    // Space (ants cannot access SKY)
    [ENTITY_TYPES.AIR]: ' ',    // Space (ants can move freely in AIR)
    [ENTITY_TYPES.DIRT]: '@',   // Hash/pound
    [ENTITY_TYPES.ANT]: 'a',     // Lowercase a
    [ENTITY_TYPES.CRUST]: '#',   // Solid block - undiggable
    [ENTITY_TYPES.ERROR]: 'X'
};
