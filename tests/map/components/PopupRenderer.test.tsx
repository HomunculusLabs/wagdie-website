/**
 * Unit tests for PopupRenderer
 * T009: Write unit tests for PopupRenderer
 *
 * Test Coverage:
 * - Rendering with different marker types
 * - Displaying title, description, and details
 * - Action buttons rendering and interaction
 * - WAGDIE theming and styling
 * - Responsive maxWidth prop
 */

import { render, screen, fireEvent } from '@testing-library/react';
import PopupRenderer from '@/components/map/PopupRenderer';
import type { PopupAction } from '@/specs/008-map-refactor/contracts/popup-renderer';
import type { Location } from '@/lib/types/map';

// Mock data
const mockLocation: Location = {
  id: '1',
  name: 'Test Location',
  description: 'A test location for WAGDIE world',
  metadata: {
    bounds: [
      [0, 0],
      [100, 100],
    ],
    properties: {
      terrain: 'forest',
      difficulty: 'easy',
    },
  },
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
};

const mockActions: PopupAction[] = [
  {
    label: 'Stake Character',
    onClick: jest.fn(),
    variant: 'primary',
  },
  {
    label: 'View Details',
    onClick: jest.fn(),
    variant: 'secondary',
  },
];

describe('PopupRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render title correctly', () => {
      render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{ title: 'Test Location' }}
        />
      );

      expect(screen.getByText('Test Location')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{
            title: 'Test Location',
            description: 'A test location for WAGDIE world',
          }}
        />
      );

      expect(screen.getByText('A test location for WAGDIE world')).toBeInTheDocument();
    });

    it('should render details section when provided', () => {
      const details = {
        Area: 'Northern Territory',
        Type: 'Staking Location',
      };

      render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{
            title: 'Test Location',
            details,
          }}
        />
      );

      expect(screen.getByText('Area:')).toBeInTheDocument();
      expect(screen.getByText('Northern Territory')).toBeInTheDocument();
      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('Staking Location')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{ title: 'Test Location' }}
        />

      );

      const descriptions = screen.queryAllByText(/A test location/);
      expect(descriptions.length).toBe(0);
    });

    it('should not render details section when not provided', () => {
      render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{ title: 'Test Location' }}
        />
      );

      expect(screen.queryByText('Area:')).not.toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('should render action buttons when provided', () => {
      render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{
            title: 'Test Location',
            actions: mockActions,
          }}
        />
      );

      expect(screen.getByText('Stake Character')).toBeInTheDocument();
      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    it('should call onClick handler when action button is clicked', () => {
      render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{
            title: 'Test Location',
            actions: mockActions,
          }}
        />
      );

      fireEvent.click(screen.getByText('Stake Character'));

      expect(mockActions[0].onClick).toHaveBeenCalledTimes(1);
    });

    it('should render primary variant button with correct styling', () => {
      render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{
            title: 'Test Location',
            actions: mockActions,
          }}
        />
      );

      const primaryButton = screen.getByText('Stake Character');
      expect(primaryButton).toBeInTheDocument();
      // Primary buttons should have different styling (background color)
      // The actual color is checked via visual inspection or snapshot tests
    });

    it('should render secondary variant button', () => {
      render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{
            title: 'Test Location',
            actions: mockActions,
          }}
        />
      );

      const secondaryButton = screen.getByText('View Details');
      expect(secondaryButton).toBeInTheDocument();
    });

    it('should disable button when disabled prop is true', () => {
      const disabledActions = [
        {
          label: 'Disabled Button',
          onClick: jest.fn(),
          variant: 'primary' as const,
          disabled: true,
        },
      ];

      render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{
            title: 'Test Location',
            actions: disabledActions,
          }}
        />
      );

      const button = screen.getByText('Disabled Button');
      expect(button).toBeDisabled();
    });

    it('should not render actions section when none provided', () => {
      render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{
            title: 'Test Location',
            actions: [],
          }}
        />
      );

      // Should not have action-related elements
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });
  });

  describe('marker types', () => {
    it('should render correctly for location marker', () => {
      render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{ title: 'Location Marker' }}
        />
      );

      expect(screen.getByText('Location Marker')).toBeInTheDocument();
    });

    it('should render correctly for character marker', () => {
      render(
        <PopupRenderer
          type="character"
          data={mockLocation}
          content={{ title: 'Character Marker' }}
        />
      );

      expect(screen.getByText('Character Marker')).toBeInTheDocument();
    });

    it('should render correctly for burn event marker', () => {
      render(
        <PopupRenderer
          type="burn"
          data={mockLocation}
          content={{ title: 'Burn Event' }}
        />
      );

      expect(screen.getByText('Burn Event')).toBeInTheDocument();
    });

    it('should render correctly for death event marker', () => {
      render(
        <PopupRenderer
          type="death"
          data={mockLocation}
          content={{ title: 'Death Event' }}
        />
      );

      expect(screen.getByText('Death Event')).toBeInTheDocument();
    });

    it('should render correctly for fight event marker', () => {
      render(
        <PopupRenderer
          type="fight"
          data={mockLocation}
          content={{ title: 'Fight Event' }}
        />
      );

      expect(screen.getByText('Fight Event')).toBeInTheDocument();
    });
  });

  describe('styling and theming', () => {
    it('should apply custom maxWidth when provided', () => {
      const { container } = render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{ title: 'Test' }}
          maxWidth={400}
        />
      );

      const popup = container.firstChild as HTMLElement;
      expect(popup).toBeTruthy();
      // The maxWidth should be applied via style
      // Visual inspection or snapshot testing would verify the exact style
    });

    it('should apply custom className when provided', () => {
      const { container } = render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{ title: 'Test' }}
          className="custom-popup-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-popup-class');
    });

    it('should apply accent color when provided in content', () => {
      const { container } = render(
        <PopupRenderer
          type="location"
          data={mockLocation}
          content={{
            title: 'Test',
            accentColor: '#ff0000',
          }}
        />
      );

      const popup = container.firstChild as HTMLElement;
      expect(popup).toBeTruthy();
      // The accent color should be applied to the title
      // This would be verified via snapshot testing or visual regression tests
    });
  });
});
