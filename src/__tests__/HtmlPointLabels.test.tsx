import { render, screen } from "@testing-library/react";
import { HtmlPointLabels } from "../components/HtmlPointLabels";
import type { HtmlLabel } from "../types";

const baseLabel: HtmlLabel = {
  id: 1,
  title: "Puesto Alpha",
  info: "5 funcs.",
  x: 100,
  y: 200,
  placement: "top",
  hasArrived: false,
};

describe("HtmlPointLabels", () => {
  it("renders nothing when labels array is empty", () => {
    const { container } = render(<HtmlPointLabels labels={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a label with title and info text", () => {
    render(<HtmlPointLabels labels={[baseLabel]} />);
    expect(screen.getByText("Puesto Alpha")).toBeInTheDocument();
    expect(screen.getByText("5 funcs.")).toBeInTheDocument();
  });

  it("shows green dot when hasArrived is true", () => {
    render(
      <HtmlPointLabels labels={[{ ...baseLabel, hasArrived: true }]} />
    );
    const dot = screen.getByText("Puesto Alpha").querySelector("span");
    expect(dot).toHaveStyle({ background: "#22c55e" });
  });

  it("shows orange dot when hasArrived is false", () => {
    render(
      <HtmlPointLabels labels={[{ ...baseLabel, hasArrived: false }]} />
    );
    const dot = screen.getByText("Puesto Alpha").querySelector("span");
    expect(dot).toHaveStyle({ background: "#f97316" });
  });

  it("uses themeColor in border when provided", () => {
    const { container } = render(
      <HtmlPointLabels labels={[{ ...baseLabel, themeColor: "#ff0000" }]} />
    );
    const labelEl = container.firstElementChild as HTMLElement;
    expect(labelEl.style.border).toContain("solid");
    expect(labelEl.style.border).toContain("1px");
  });

  it("uses default color when no themeColor", () => {
    const { container } = render(
      <HtmlPointLabels labels={[{ ...baseLabel }]} />
    );
    const labelEl = container.firstElementChild as HTMLElement;
    expect(labelEl.style.border).toContain("rgba(56, 189, 248, 0.5)");
  });

  it('applies correct position for "top" placement', () => {
    const { container } = render(
      <HtmlPointLabels labels={[{ ...baseLabel, placement: "top", x: 100, y: 200 }]} />
    );
    const labelEl = container.firstElementChild as HTMLElement;
    expect(labelEl.style.top).toBe("188px");
    expect(labelEl.style.left).toBe("100px");
    expect(labelEl.style.transform).toBe("translate(-50%, -100%)");
  });

  it('applies correct position for "bottom" placement', () => {
    const { container } = render(
      <HtmlPointLabels labels={[{ ...baseLabel, placement: "bottom", x: 100, y: 200 }]} />
    );
    const labelEl = container.firstElementChild as HTMLElement;
    expect(labelEl.style.top).toBe("212px");
    expect(labelEl.style.left).toBe("100px");
    expect(labelEl.style.transform).toBe("translate(-50%, 0)");
  });

  it('applies correct position for "left" placement', () => {
    const { container } = render(
      <HtmlPointLabels labels={[{ ...baseLabel, placement: "left", x: 100, y: 200 }]} />
    );
    const labelEl = container.firstElementChild as HTMLElement;
    expect(labelEl.style.top).toBe("200px");
    expect(labelEl.style.left).toBe("88px");
    expect(labelEl.style.transform).toBe("translate(-100%, -50%)");
  });

  it('applies correct position for "right" placement', () => {
    const { container } = render(
      <HtmlPointLabels labels={[{ ...baseLabel, placement: "right", x: 100, y: 200 }]} />
    );
    const labelEl = container.firstElementChild as HTMLElement;
    expect(labelEl.style.top).toBe("200px");
    expect(labelEl.style.left).toBe("112px");
    expect(labelEl.style.transform).toBe("translate(0, -50%)");
  });

  it("calls onSelectLabel when label is clicked", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <HtmlPointLabels labels={[baseLabel]} onSelectLabel={onSelect} />
    );
    const labelEl = container.firstElementChild as HTMLElement;
    labelEl.click();
    expect(onSelect).toHaveBeenCalledWith(baseLabel.id);
  });

  it("truncates teamNames at 3 badges and displays '... X más'", () => {
    render(
      <HtmlPointLabels
        labels={[
          {
            ...baseLabel,
            teamNames: ["Grupo 1", "Grupo 2", "Grupo 3", "Grupo 4", "Grupo 5"],
          },
        ]}
        isAuthenticated={true}
      />
    );
    expect(screen.getByText("Grupo 1")).toBeInTheDocument();
    expect(screen.getByText("Grupo 2")).toBeInTheDocument();
    expect(screen.getByText("Grupo 3")).toBeInTheDocument();
    expect(screen.queryByText("Grupo 4")).toBeNull();
    expect(screen.queryByText("Grupo 5")).toBeNull();
    expect(screen.getByText("... 2 más")).toBeInTheDocument();
  });

  it("renders recovered count badge properly", () => {
    render(
      <HtmlPointLabels
        labels={[
          {
            ...baseLabel,
            recoveredCount: 4,
          },
        ]}
      />
    );
    expect(screen.getByText("Recup. 4")).toBeInTheDocument();
  });
});
