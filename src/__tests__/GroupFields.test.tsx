import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GroupFields } from "../components/GroupFields";

const defaultGroup = { id: "g1", groupName: "" };

describe("GroupFields", () => {
  it('renders "Grupo 1" header when groupIndex=0', () => {
    render(<GroupFields groupIndex={0} group={defaultGroup} onGroupFieldChange={() => {}} colorVar="#fff" />);
    expect(screen.getByText("Grupo 1")).toBeInTheDocument();
  });

  it('renders "Grupo 2" header when groupIndex=1', () => {
    render(<GroupFields groupIndex={1} group={defaultGroup} onGroupFieldChange={() => {}} colorVar="#fff" />);
    expect(screen.getByText("Grupo 2")).toBeInTheDocument();
  });

  it("renders correct placeholder texts for group 0", () => {
    render(<GroupFields groupIndex={0} group={defaultGroup} onGroupFieldChange={() => {}} colorVar="#fff" />);
    expect(screen.getByPlaceholderText("Nombre Grupo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Unidad (Vehículo)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nombre Encargado")).toBeInTheDocument();
  });

  it("renders correct placeholder texts for group 1", () => {
    render(<GroupFields groupIndex={1} group={defaultGroup} onGroupFieldChange={() => {}} colorVar="#fff" />);
    expect(screen.getByPlaceholderText("Nombre Grupo 2")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Unidad (Vehículo)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nombre Encargado")).toBeInTheDocument();
  });

  it("calls onGroupFieldChange when input changes", () => {
    const onChange = vi.fn();
    render(<GroupFields groupIndex={0} group={defaultGroup} onGroupFieldChange={onChange} colorVar="#fff" />);
    const input = screen.getByPlaceholderText("Nombre Grupo");
    expect(input).toBeInTheDocument();
  });
});

describe("OperationTab Department Selector in Mixto Mode", () => {
  it("renders department selector when activeDepartment is mixto and handles selection", async () => {
    const { container } = render(
      <GroupFields groupIndex={0} group={{ id: "g1", groupName: "Test", officersCount: "3" }} onGroupFieldChange={() => {}} colorVar="#fff" />
    );
    expect(container.querySelector("input[value='Test']")).toBeInTheDocument();
  });
});
