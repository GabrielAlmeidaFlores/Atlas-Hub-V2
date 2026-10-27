import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { Select } from "./index";

describe("Select", () => {
  test("abre e seleciona uma opção customizada", async () => {
    const onValueChange = vi.fn();
    render(
      <Select
        value=""
        onValueChange={onValueChange}
        options={[
          { value: "a", label: "Opção A" },
          { value: "b", label: "Opção B" },
        ]}
        placeholder="Escolha"
        ariaLabel="Teste"
      />,
    );
    const trigger = screen.getByRole("combobox", { name: "Teste" });
    expect(trigger).toHaveTextContent("Escolha");
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("option", { name: "Opção B" }));
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  test("permite opção vazia explícita", async () => {
    const onValueChange = vi.fn();
    render(
      <Select
        value="a"
        onValueChange={onValueChange}
        options={[
          { value: "a", label: "Opção A" },
          { value: "", label: "Sem opção" },
        ]}
        ariaLabel="Teste vazio"
      />,
    );
    await userEvent.click(screen.getByRole("combobox", { name: "Teste vazio" }));
    await userEvent.click(await screen.findByRole("option", { name: "Sem opção" }));
    expect(onValueChange).toHaveBeenCalledWith("");
  });
});
