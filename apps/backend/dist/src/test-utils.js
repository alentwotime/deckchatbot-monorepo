import { logInfo, logError, structuredLogger } from './utils/logger.js';
import { mtgCardName, validateDeckLegality } from './utils/validation.js';
import imageProcessor, { validateProcessingOptions, getCardRecognitionSettings } from './utils/image-processor.js';
// Test logger functionality
console.log('Testing logger...');
logInfo('Logger test started');
logError(new Error('Test error'), 'Testing error logging');
structuredLogger.userAction('test-user-123', 'test-action', 'test-resource', { test: true });
structuredLogger.performance('test-operation', 150, { component: 'utils-test' });
// Test validation functionality
console.log('Testing validation...');
// Test MTG card name validation
try {
    const validCardName = mtgCardName.parse('Lightning Bolt');
    console.log('Valid card name:', validCardName);
}
catch (error) {
    console.error('Card name validation failed:', error);
}
try {
    const invalidCardName = mtgCardName.parse(''); // Should fail
    console.log('Invalid card name passed:', invalidCardName);
}
catch (error) {
    console.log('Card name validation correctly failed for empty string');
}
// Test deck legality validation
const testDeck = {
    name: 'Test Deck',
    format: 'standard',
    cards: [
        {
            cardId: '123e4567-e89b-12d3-a456-426614174000',
            cardName: 'Lightning Bolt',
            quantity: 4,
            isSideboard: false
        }
    ],
    isPublic: false
};
const deckErrors = validateDeckLegality(testDeck);
console.log('Deck validation errors:', deckErrors);
// Test image processor functionality
console.log('Testing image processor...');
// Test processing options validation
const testProcessingOptions = getCardRecognitionSettings();
const processingErrors = validateProcessingOptions(testProcessingOptions);
console.log('Processing options validation errors:', processingErrors);
// Test image processing (with placeholder data)
const testBuffer = Buffer.from('test image data');
imageProcessor.extractImageMetadata(testBuffer)
    .then(metadata => {
    console.log('Image metadata extracted:', metadata);
})
    .catch(error => {
    console.error('Image metadata extraction failed:', error);
});
imageProcessor.extractTextFromImage(testBuffer)
    .then(ocrResult => {
    console.log('OCR result:', ocrResult);
})
    .catch(error => {
    console.error('OCR failed:', error);
});
imageProcessor.recognizeCard(testBuffer)
    .then(cardResult => {
    console.log('Card recognition result:', cardResult);
})
    .catch(error => {
    console.error('Card recognition failed:', error);
});
console.log('All utility tests completed!');
//# sourceMappingURL=test-utils.js.map