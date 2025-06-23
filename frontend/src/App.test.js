import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// 🧪 Mock fetch to simulate AI response
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          result: 'AI processed image successfully',
          filename: 'mock.jpg',
          size_bytes: 12345,
        }),
      ok: true,
    })
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

test('renders DeckChatbot title', () => {
  render(<App />);
  const title = screen.getByText(/DeckChatbot/i);
  expect(title).toBeInTheDocument();
});

test('uploads image and shows AI response', async () => {
  render(<App />);

  // Simulate file upload
  const file = new File(['test content'], 'mock.jpg', { type: 'image/jpeg' });
  const fileInput = screen.getByLabelText(/upload/i);
  fireEvent.change(fileInput, { target: { files: [file] } });

  // Click the Analyze button
  const button = screen.getByRole('button', { name: /analyze/i });
  fireEvent.click(button);

  // Wait for the mocked response to appear
  await waitFor(() =>
    expect(screen.getByText(/AI processed image successfully/i)).toBeInTheDocument()
  );

  expect(screen.getByText(/mock.jpg/)).toBeInTheDocument();
});
