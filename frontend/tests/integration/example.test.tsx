import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

/**
 * INTEGRATION TESTS
 *
 * Objectif : Tester les composants avec leurs enfants et interactions
 * - Backend toujours mocké (fetch/services/stores)
 * - Focus sur les interactions utilisateur
 * - Tester plusieurs composants ensemble
 * - Vérifier le comportement UI/UX
 */

// Mock du store de langue
vi.mock('@/store/language', () => ({
  useLanguageStore: () => ({
    content: {
      watchlists: {
        name: 'Name',
        description: 'Description',
        namePlaceholder: 'Enter name',
        descriptionPlaceholder: 'Enter description',
        save: 'Save',
        saving: 'Saving...',
        editWatchlist: 'Edit Watchlist',
        editWatchlistDescription: 'Modify your watchlist details',
      },
    },
  }),
}));

// Example component to test
function WatchlistForm({
  onSubmit,
}: {
  onSubmit: (data: { name: string; description: string }) => void;
}) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="name">Name</label>
      <input
        id="name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter name"
      />

      <label htmlFor="description">Description</label>
      <textarea
        id="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter description"
      />

      <button type="submit">Save</button>
    </form>
  );
}

// Wrapper pour les tests avec React Router
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

describe('Integration Tests - Component Interactions', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('WatchlistForm', () => {
    it('should render form fields', () => {
      render(
        <TestWrapper>
          <WatchlistForm onSubmit={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('should update input values when user types', async () => {
      render(
        <TestWrapper>
          <WatchlistForm onSubmit={vi.fn()} />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.type(nameInput, 'My Watchlist');
      await user.type(descriptionInput, 'A great collection');

      expect(nameInput).toHaveValue('My Watchlist');
      expect(descriptionInput).toHaveValue('A great collection');
    });

    it('should call onSubmit with form data when submitted', async () => {
      const handleSubmit = vi.fn();
      render(
        <TestWrapper>
          <WatchlistForm onSubmit={handleSubmit} />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const submitButton = screen.getByRole('button', { name: /save/i });

      await user.type(nameInput, 'Test Name');
      await user.type(descriptionInput, 'Test Description');
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          name: 'Test Name',
          description: 'Test Description',
        });
      });
    });

    it('should handle empty form submission', async () => {
      const handleSubmit = vi.fn();
      render(
        <TestWrapper>
          <WatchlistForm onSubmit={handleSubmit} />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          name: '',
          description: '',
        });
      });
    });
  });
});
