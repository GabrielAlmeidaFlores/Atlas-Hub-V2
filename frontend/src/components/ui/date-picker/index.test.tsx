import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { DatePicker } from "./index";

describe("DatePicker", () => {
  test("navega entre meses e seleciona um dia", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker value="2026-10-27" onValueChange={onValueChange} ariaLabel="Data" />);
    await userEvent.click(screen.getByRole("button", { name: "Data" }));
    expect(screen.getByRole("button", { name: "Outubro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2026" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Próximo mês" }));
    expect(screen.getByRole("button", { name: "Novembro" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "15" }));
    expect(onValueChange).toHaveBeenCalledWith("2026-11-15");
  });

  test("permite escolher ano e mês diretamente", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker value="2026-10-27" onValueChange={onValueChange} ariaLabel="Data" />);
    await userEvent.click(screen.getByRole("button", { name: "Data" }));
    await userEvent.click(screen.getByRole("button", { name: "2026" }));
    expect(screen.getByRole("button", { name: "2024" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "2024" }));
    expect(screen.getByRole("button", { name: "Jan" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mar" }));
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "15" }));
    expect(onValueChange).toHaveBeenCalledWith("2024-03-15");
  });

  test("abre o calendário customizado e seleciona hoje", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker value="" onValueChange={onValueChange} ariaLabel="Data" />);
    await userEvent.click(screen.getByRole("button", { name: "Data" }));
    await userEvent.click(await screen.findByRole("button", { name: "Hoje" }));
    const date = new Date();
    const expected = `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    expect(onValueChange).toHaveBeenCalledWith(expected);
  });
});
