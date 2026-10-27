import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { Checkbox } from "./index";

describe("Checkbox", () => {
  test("marca e desmarca com o visual customizado", async () => {
    const onChange = vi.fn();
    render(<Checkbox checked={false} onChange={onChange} label="Aceito" />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
