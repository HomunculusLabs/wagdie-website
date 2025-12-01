/**
 * Basic tests for migration framework
 */

import { DataTransformer } from '../src/data/transformers/DataTransformer';
import { ValidationService } from '../src/services/ValidationService';

describe('Migration Framework Basic Tests', () => {
  describe('DataTransformer', () => {
    test('should transform character sheet data', () => {
      const characterData = {
        id: 'dev:character_sheets/1124',
        hit_points: 9,
        experience_points: 0,
        tokenIdInt: 1124,
        level: 1,
        origin: 'Astorian Adventurer',
        name: 'Arkvir',
        equipment: {
          armor: 'Astorian Adventurer Garb',
          back: 'Her Godlings Disk',
          mask: 'None'
        },
        attributes: {
          dexterity: 17,
          constitution: 15,
          strength: 10,
          charisma: 17,
          wisdom: 12,
          intelligence: 15
        },
        location: 'Unknown'
      };

      const result = DataTransformer.transformCharacterSheet(characterData);

      expect(result).toEqual({
        tokenId: 1124,
        name: 'Arkvir',
        level: 1,
        origin: 'Astorian Adventurer',
        location: 'Unknown',
        hitPoints: 9,
        experiencePoints: 0,
        equipment: {
          armor: 'Astorian Adventurer Garb',
          back: 'Her Godlings Disk',
          mask: 'None'
        },
        attributes: {
          dexterity: 17,
          constitution: 15,
          strength: 10,
          charisma: 17,
          wisdom: 12,
          intelligence: 15
        },
        backgroundStory: undefined
      });
    });

    test('should transform metadata record data', () => {
      const metadataData = {
        tokenId: '1',
        name: 'We are All Going to Die #1',
        description: 'No Website. Twitter and Contract Only.',
        image: 'ipfs://bafyreielrg5d7ih6seadp4xgvyf5h4kpiffo7a3ylw3uzwa6jzj6wpxowq',
        attributes: [
          { value: 'Blessing of the Worm', trait_type: 'Armor' },
          { value: 'Uirian Bow', trait_type: 'Back' }
        ]
      };

      const result = DataTransformer.transformMetadataRecord(metadataData);

      expect(result).toEqual({
        tokenId: 1,
        name: 'We are All Going to Die #1',
        description: 'No Website. Twitter and Contract Only.',
        imageUrl: 'ipfs://bafyreielrg5d7ih6seadp4xgvyf5h4kpiffo7a3ylw3uzwa6jzj6wpxowq',
        attributes: {
          Armor: 'Blessing of the Worm',
          Back: 'Uirian Bow'
        }
      });
    });
  });

  describe('ValidationService', () => {
    test('should validate character sheet records', () => {
      const validationService = new ValidationService();
      const validCharacter = {
        tokenId: 1124,
        name: 'Arkvir',
        level: 1
      };

      const result = validationService.validateRecord('character_sheets', validCharacter, 'test_1124');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid character sheet records', () => {
      const validationService = new ValidationService();
      const invalidCharacter = {
        tokenId: -1,
        name: '',
        level: 101
      };

      const result = validationService.validateRecord('character_sheets', invalidCharacter, 'test_invalid');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});