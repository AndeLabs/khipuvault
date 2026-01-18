import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AmountDisplay, PercentageDisplay, BalanceCard } from "../amount-display";

describe("AmountDisplay", () => {
  it("renders amount with default symbol", () => {
    render(<AmountDisplay amount={1000} />);

    expect(screen.getByText("1,000.00")).toBeInTheDocument();
    expect(screen.getByText("mUSD")).toBeInTheDocument();
  });

  it("renders amount with custom symbol", () => {
    render(<AmountDisplay amount={500} symbol="BTC" />);

    expect(screen.getByText("500.00")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
  });

  it("handles string amounts", () => {
    render(<AmountDisplay amount="2500.5" />);

    expect(screen.getByText("2,500.50")).toBeInTheDocument();
  });

  it("formats with custom decimals", () => {
    render(<AmountDisplay amount={1234.5678} decimals={4} />);

    expect(screen.getByText("1,234.5678")).toBeInTheDocument();
  });

  it("shows zero when showZero is true (default)", () => {
    render(<AmountDisplay amount={0} />);

    expect(screen.getByText("0.00")).toBeInTheDocument();
  });

  it("shows dash when showZero is false and amount is 0", () => {
    render(<AmountDisplay amount={0} showZero={false} />);

    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.queryByText("0.00")).not.toBeInTheDocument();
  });

  it("renders with prefix", () => {
    render(<AmountDisplay amount={100} prefix="$" />);

    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("100.00")).toBeInTheDocument();
  });

  it("renders with suffix", () => {
    render(<AmountDisplay amount={100} suffix="/day" />);

    expect(screen.getByText("100.00")).toBeInTheDocument();
    expect(screen.getByText("/day")).toBeInTheDocument();
  });

  it("applies size classes correctly", () => {
    const { container } = render(<AmountDisplay amount={100} size="xl" />);

    expect(container.querySelector(".text-2xl")).toBeInTheDocument();
  });

  it("applies trend color for up trend", () => {
    const { container } = render(<AmountDisplay amount={100} trend="up" />);

    expect(container.querySelector(".text-success")).toBeInTheDocument();
  });

  it("applies trend color for down trend", () => {
    const { container } = render(<AmountDisplay amount={100} trend="down" />);

    expect(container.querySelector(".text-error")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<AmountDisplay amount={100} className="custom-class" />);

    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});

describe("PercentageDisplay", () => {
  it("renders positive percentage with up arrow", () => {
    render(<PercentageDisplay value={5.5} />);

    expect(screen.getByText("▲")).toBeInTheDocument();
    expect(screen.getByText(/\+5\.50%/)).toBeInTheDocument();
  });

  it("renders negative percentage with down arrow", () => {
    render(<PercentageDisplay value={-3.2} />);

    expect(screen.getByText("▼")).toBeInTheDocument();
    expect(screen.getByText(/-3\.20%/)).toBeInTheDocument();
  });

  it("renders zero percentage without sign", () => {
    render(<PercentageDisplay value={0} />);

    expect(screen.getByText("0.00%")).toBeInTheDocument();
    expect(screen.queryByText("▲")).not.toBeInTheDocument();
    expect(screen.queryByText("▼")).not.toBeInTheDocument();
  });

  it("hides sign when showSign is false", () => {
    render(<PercentageDisplay value={10} showSign={false} />);

    expect(screen.queryByText("▲")).not.toBeInTheDocument();
    expect(screen.getByText("10.00%")).toBeInTheDocument();
  });

  it("formats with custom decimals", () => {
    render(<PercentageDisplay value={12.3456} decimals={1} />);

    expect(screen.getByText(/12\.3%/)).toBeInTheDocument();
  });

  it("applies success color for positive values", () => {
    const { container } = render(<PercentageDisplay value={5} />);

    expect(container.querySelector(".text-success")).toBeInTheDocument();
  });

  it("applies error color for negative values", () => {
    const { container } = render(<PercentageDisplay value={-5} />);

    expect(container.querySelector(".text-error")).toBeInTheDocument();
  });

  it("applies muted color for zero", () => {
    const { container } = render(<PercentageDisplay value={0} />);

    expect(container.querySelector(".text-muted-foreground")).toBeInTheDocument();
  });
});

describe("BalanceCard", () => {
  it("renders label and amount", () => {
    render(<BalanceCard label="Total Balance" amount={5000} />);

    expect(screen.getByText("Total Balance")).toBeInTheDocument();
    expect(screen.getByText("5,000.00")).toBeInTheDocument();
  });

  it("renders with custom symbol", () => {
    render(<BalanceCard label="Balance" amount={100} symbol="ETH" />);

    expect(screen.getByText("ETH")).toBeInTheDocument();
  });

  it("renders change percentage when provided", () => {
    render(<BalanceCard label="Balance" amount={1000} change={5.5} />);

    expect(screen.getByText(/5\.50%/)).toBeInTheDocument();
  });

  it("shows loading skeleton when loading", () => {
    const { container } = render(<BalanceCard label="Balance" amount={0} loading />);

    expect(container.querySelectorAll(".animate-shimmer").length).toBeGreaterThan(0);
    expect(screen.queryByText("Balance")).not.toBeInTheDocument();
  });

  it("does not show change when not provided", () => {
    render(<BalanceCard label="Balance" amount={1000} />);

    expect(screen.queryByText("%")).not.toBeInTheDocument();
  });

  it("applies trend to amount display", () => {
    const { container } = render(<BalanceCard label="Balance" amount={1000} trend="up" />);

    expect(container.querySelector(".text-success")).toBeInTheDocument();
  });
});
