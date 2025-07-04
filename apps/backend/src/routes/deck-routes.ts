import { Router } from 'express';
import { DeckController } from '../controllers/deck-controller.js';

const router = Router();
const deckController = new DeckController();

/**
 * @route POST /api/v1/decks
 * @desc Save a deck
 * @access Public
 */
router.post('/', deckController.saveDeck);

/**
 * @route GET /api/v1/decks/:deckId
 * @desc Retrieve a deck by ID
 * @access Public
 */
router.get('/:deckId', deckController.getDeck);

/**
 * @route GET /api/v1/decks
 * @desc Search and filter decks
 * @access Public
 */
router.get('/', deckController.searchDecks);

/**
 * @route PUT /api/v1/decks/:deckId
 * @desc Update a deck
 * @access Public
 */
router.put('/:deckId', deckController.updateDeck);

/**
 * @route DELETE /api/v1/decks/:deckId
 * @desc Delete a deck
 * @access Public
 */
router.delete('/:deckId', deckController.deleteDeck);

/**
 * @route GET /api/v1/decks/:deckId/export
 * @desc Export deck in various formats
 * @access Public
 */
router.get('/:deckId/export', deckController.exportDeck);

/**
 * @route POST /api/v1/decks/import
 * @desc Import deck from file
 * @access Public
 */
router.post('/import', deckController.importDeck);

/**
 * @route GET /api/v1/decks/:deckId/statistics
 * @desc Get deck statistics
 * @access Public
 */
router.get('/:deckId/statistics', deckController.getDeckStatistics);

/**
 * @route POST /api/v1/decks/:deckId/blueprint
 * @desc Generate deck blueprint (NEW)
 * @access Public
 */
router.post('/:deckId/blueprint', deckController.generateDeckBlueprint);

/**
 * @route POST /api/v1/decks/:deckId/3d-model
 * @desc Create 3D deck model (NEW)
 * @access Public
 */
router.post('/:deckId/3d-model', deckController.create3DDeckModel);

/**
 * @route GET /api/v1/decks/popular
 * @desc Get popular decks
 * @access Public
 */
router.get('/popular', deckController.getPopularDecks);

export default router;
