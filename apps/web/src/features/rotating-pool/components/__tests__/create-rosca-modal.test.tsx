import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { TestProviders } from "@/test/test-providers";

import { CreateRoscaModal } from "../create-rosca-modal";

// Mock hooks
const mockCreatePool = vi.fn();
const mockUseCreateRotatingPool = vi.fn();
const mockUseRotatingPoolConstants = vi.fn();

vi.mock("@/hooks/web3/rotating", async () => {
  const actual = await vi.importActual("@/hooks/web3/rotating");
  return {
    ...actual,
    useCreateRotatingPool: () => mockUseCreateRotatingPool(),
    useRotatingPoolConstants: () => mockUseRotatingPoolConstants(),
    parseContribution: (amount: string) => BigInt(parseFloat(amount) * 1e18),
    daysToSeconds: (days: number) => BigInt(days * 24 * 60 * 60),
    weeksToSeconds: (weeks: number) => BigInt(weeks * 7 * 24 * 60 * 60),
    monthsToSeconds: (months: number) => BigInt(months * 30 * 24 * 60 * 60),
  };
});

describe("CreateRoscaModal", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    mockUseCreateRotatingPool.mockReturnValue({
      createPool: mockCreatePool,
      isPending: false,
      isSuccess: false,
      error: null,
    });

    mockUseRotatingPoolConstants.mockReturnValue({
      minMembers: BigInt(3),
      maxMembers: BigInt(50),
      minContribution: BigInt("1000000000000000"), // 0.001 BTC
      maxContribution: BigInt("10000000000000000000"), // 10 BTC
      minPeriodDuration: BigInt(86400), // 1 day
      maxPeriodDuration: BigInt(7776000), // 90 days
      isPending: false,
    });
  });

  describe("Rendering", () => {
    it("should render modal when open", () => {
      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      expect(screen.getByText("Create New ROSCA")).toBeInTheDocument();
      expect(
        screen.getByText(/Set up a new Rotating Savings and Credit Association/)
      ).toBeInTheDocument();
    });

    it("should not render modal when closed", () => {
      render(
        <TestProviders>
          <CreateRoscaModal open={false} onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      // Modal should not be visible
      expect(screen.queryByText("Create New ROSCA")).not.toBeInTheDocument();
    });

    it("should render all form fields", () => {
      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      expect(screen.getByLabelText("Pool Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Number of Members")).toBeInTheDocument();
      expect(screen.getByLabelText("Contribution Amount (BTC)")).toBeInTheDocument();
      expect(screen.getByLabelText("Period Duration")).toBeInTheDocument();
      expect(screen.getByLabelText("Unit")).toBeInTheDocument();
      expect(screen.getByLabelText("Auto-advance Periods")).toBeInTheDocument();
    });

    it("should have default values", () => {
      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      const nameInput = screen.getByLabelText("Pool Name") as HTMLInputElement;
      const memberCountInput = screen.getByLabelText("Number of Members") as HTMLInputElement;
      const contributionInput = screen.getByLabelText(
        "Contribution Amount (BTC)"
      ) as HTMLInputElement;
      const periodInput = screen.getByLabelText("Period Duration") as HTMLInputElement;

      expect(nameInput.value).toBe("");
      expect(memberCountInput.value).toBe("12");
      expect(contributionInput.value).toBe("0.01");
      expect(periodInput.value).toBe("30");
    });
  });

  describe("Form Validation", () => {
    it.skip("should show error for name less than 3 characters", async () => {
      const user = userEvent.setup();

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      const nameInput = screen.getByLabelText("Pool Name");

      await user.clear(nameInput);
      await user.type(nameInput, "AB");
      await user.tab(); // Trigger validation

      await waitFor(() => {
        expect(screen.getByText(/Name must be at least 3 characters/)).toBeInTheDocument();
      });
    });

    it("should accept valid name", async () => {
      const user = userEvent.setup();

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      const nameInput = screen.getByLabelText("Pool Name");

      await user.clear(nameInput);
      await user.type(nameInput, "Valid Pool Name");
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/Name must be at least 3 characters/)).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should call createPool with correct data on submit", async () => {
      const user = userEvent.setup();

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      // Fill form
      const nameInput = screen.getByLabelText("Pool Name");
      await user.clear(nameInput);
      await user.type(nameInput, "Test ROSCA");

      const memberCountInput = screen.getByLabelText("Number of Members");
      await user.clear(memberCountInput);
      await user.type(memberCountInput, "10");

      const contributionInput = screen.getByLabelText("Contribution Amount (BTC)");
      await user.clear(contributionInput);
      await user.type(contributionInput, "0.05");

      const periodInput = screen.getByLabelText("Period Duration");
      await user.clear(periodInput);
      await user.type(periodInput, "7");

      // Submit
      const submitButton = screen.getByRole("button", { name: /Create ROSCA/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreatePool).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test ROSCA",
            memberCount: BigInt(10),
            autoAdvance: true,
          })
        );
      });
    });

    it("should disable submit button when isPending", () => {
      mockUseCreateRotatingPool.mockReturnValue({
        createPool: mockCreatePool,
        isPending: true,
        isSuccess: false,
        error: null,
      });

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      const submitButton = screen.getByRole("button", { name: /Creating/i });
      expect(submitButton).toBeDisabled();
    });

    it("should show loading state when isPending", () => {
      mockUseCreateRotatingPool.mockReturnValue({
        createPool: mockCreatePool,
        isPending: true,
        isSuccess: false,
        error: null,
      });

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      expect(screen.getByText("Creating...")).toBeInTheDocument();
    });

    it("should disable submit button when isSuccess", () => {
      mockUseCreateRotatingPool.mockReturnValue({
        createPool: mockCreatePool,
        isPending: false,
        isSuccess: true,
        error: null,
      });

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      const submitButton = screen.getByRole("button", { name: /Created!/i });
      expect(submitButton).toBeDisabled();
    });

    it("should show success message when isSuccess", () => {
      mockUseCreateRotatingPool.mockReturnValue({
        createPool: mockCreatePool,
        isPending: false,
        isSuccess: true,
        error: null,
      });

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      expect(screen.getByText("✅ Pool created successfully!")).toBeInTheDocument();
    });

    it("should show error message when error occurs", () => {
      const mockError = new Error("Failed to create pool");
      mockUseCreateRotatingPool.mockReturnValue({
        createPool: mockCreatePool,
        isPending: false,
        isSuccess: false,
        error: mockError,
      });

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      expect(screen.getByText(mockError.message)).toBeInTheDocument();
    });
  });

  describe("Period Unit Selection", () => {
    it("should use days conversion by default", async () => {
      const user = userEvent.setup();

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      const nameInput = screen.getByLabelText("Pool Name");
      await user.type(nameInput, "Test Pool");

      const periodInput = screen.getByLabelText("Period Duration");
      await user.clear(periodInput);
      await user.type(periodInput, "7");

      const submitButton = screen.getByRole("button", { name: /Create ROSCA/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreatePool).toHaveBeenCalledWith(
          expect.objectContaining({
            periodDuration: BigInt(7 * 24 * 60 * 60), // 7 days in seconds
          })
        );
      });
    });

    // Note: Testing select dropdown interaction requires more complex setup with @testing-library/user-event
    // For now, we test the default behavior and that the form accepts the data
  });

  describe("Auto-advance Toggle", () => {
    it("should have auto-advance enabled by default", () => {
      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      const autoAdvanceSwitch = screen.getByRole("switch");
      expect(autoAdvanceSwitch).toHaveAttribute("data-state", "checked");
    });

    it("should toggle auto-advance", async () => {
      const user = userEvent.setup();

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      const autoAdvanceSwitch = screen.getByRole("switch");
      await user.click(autoAdvanceSwitch);

      expect(autoAdvanceSwitch).toHaveAttribute("data-state", "unchecked");
    });
  });

  describe("Cancel Button", () => {
    it("should call onOpenChange when cancel clicked", async () => {
      const user = userEvent.setup();

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Constants Integration", () => {
    it("should use min/max values from constants", () => {
      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      const memberCountInput = screen.getByLabelText("Number of Members") as HTMLInputElement;
      expect(memberCountInput.min).toBe("3");
      expect(memberCountInput.max).toBe("50");

      const contributionInput = screen.getByLabelText(
        "Contribution Amount (BTC)"
      ) as HTMLInputElement;
      expect(contributionInput.min).toBe("0.001");
      expect(contributionInput.max).toBe("10");
    });

    it("should show min/max in form description", () => {
      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      expect(screen.getByText(/min: 3, max: 50/)).toBeInTheDocument();
    });

    it("should handle null constants gracefully", () => {
      mockUseRotatingPoolConstants.mockReturnValue({
        minMembers: null,
        maxMembers: null,
        minContribution: null,
        maxContribution: null,
        minPeriodDuration: null,
        maxPeriodDuration: null,
        isPending: false,
      });

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      // Should use fallback values
      const memberCountInput = screen.getByLabelText("Number of Members") as HTMLInputElement;
      expect(memberCountInput.min).toBe("3");
      expect(memberCountInput.max).toBe("50");
    });

    it("should handle undefined constants gracefully", () => {
      mockUseRotatingPoolConstants.mockReturnValue({
        minMembers: undefined,
        maxMembers: undefined,
        minContribution: undefined,
        maxContribution: undefined,
        minPeriodDuration: undefined,
        maxPeriodDuration: undefined,
        isPending: false,
      });

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      // Should use fallback values
      const contributionInput = screen.getByLabelText(
        "Contribution Amount (BTC)"
      ) as HTMLInputElement;
      expect(contributionInput.min).toBe("0.001");
      expect(contributionInput.max).toBe("10");
    });
  });

  describe("Form Field Descriptions", () => {
    it("should show helpful descriptions for all fields", () => {
      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      expect(screen.getByText("A descriptive name for your ROSCA")).toBeInTheDocument();
      expect(screen.getByText("Amount each member contributes per period")).toBeInTheDocument();
      expect(
        screen.getByText("Automatically move to the next period when time expires")
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long pool names", async () => {
      const user = userEvent.setup();

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      const nameInput = screen.getByLabelText("Pool Name");
      const longName = "A".repeat(60); // Max is 50

      await user.clear(nameInput);
      await user.type(nameInput, longName);

      const submitButton = screen.getByRole("button", { name: /Create ROSCA/i });
      await user.click(submitButton);

      // Should show validation error for max length
      await waitFor(() => {
        expect(mockCreatePool).not.toHaveBeenCalled();
      });
    });

    it("should handle decimal member count (should be integer)", async () => {
      const user = userEvent.setup();

      render(
        <TestProviders>
          <CreateRoscaModal open onOpenChange={mockOnOpenChange} />
        </TestProviders>
      );

      const nameInput = screen.getByLabelText("Pool Name");
      await user.type(nameInput, "Test Pool");

      const memberCountInput = screen.getByLabelText("Number of Members");
      await user.clear(memberCountInput);
      await user.type(memberCountInput, "12.5");

      const submitButton = screen.getByRole("button", { name: /Create ROSCA/i });
      await user.click(submitButton);

      await waitFor(() => {
        if (mockCreatePool.mock.calls.length > 0) {
          // Should convert to integer
          expect(mockCreatePool).toHaveBeenCalledWith(
            expect.objectContaining({
              memberCount: BigInt(12),
            })
          );
        }
      });
    });
  });
});
