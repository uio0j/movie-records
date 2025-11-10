import React, { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditableSongList } from "../src/components/EditableSongList";

/**
 * Realistic typing version:
 * - Keeps `userEvent.type` (multiple onChange calls).
 * - For the two flaky tests, we assert that one of the calls contains the final array,
 *   using `mock.calls` + `toContainEqual`.
 */

describe("EditableSongList Component (realistic userEvent version)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    function Harness({ initialSongs = [] as string[] }) {
        const [songs, setSongs] = useState<string[]>(initialSongs);
        return <EditableSongList songs={songs} setSongs={setSongs} />;
    }

    test("renders Add Song button and an empty list initially", () => {
        render(<EditableSongList songs={[]} setSongs={jest.fn()} />);

        expect(
            screen.getByRole("button", { name: /add song/i }),
        ).toBeInTheDocument();
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    test("clicking Add Song calls setSongs with extended array", async () => {
        const mockSetSongs = jest.fn();
        render(<EditableSongList songs={["a", "b"]} setSongs={mockSetSongs} />);

        await userEvent.click(
            screen.getByRole("button", { name: /add song/i }),
        );
        expect(mockSetSongs).toHaveBeenCalledTimes(1);
        expect(mockSetSongs).toHaveBeenCalledWith(["a", "b", ""]);
    });

    test("adds a visible input when using a stateful harness", async () => {
        render(<Harness initialSongs={[]} />);

        await userEvent.click(
            screen.getByRole("button", { name: /add song/i }),
        );
        const inputs = screen.getAllByRole("textbox");
        expect(inputs).toHaveLength(1);
        expect(inputs[0]).toHaveValue("");
    });

    // --------------------------------------------------------------------------------------

    test("edit workflow with Harness updates DOM value", async () => {
        render(<Harness initialSongs={["x", "y"]} />);

        const inputs = screen.getAllByRole("textbox");
        await userEvent.clear(inputs[1]);
        await userEvent.type(inputs[1], "YY");

        await waitFor(() => {
            expect(inputs[1]).toHaveValue("YY");
        });
    });

    test("clicking ❌ calls setSongs with the song removed by index", async () => {
        const mockSetSongs = jest.fn();
        render(
            <EditableSongList
                songs={["s1", "s2", "s3"]}
                setSongs={mockSetSongs}
            />,
        );

        const deleteButtons = screen.getAllByRole("button", { name: "❌" });
        await userEvent.click(deleteButtons[1]);

        expect(mockSetSongs).toHaveBeenCalledTimes(1);
        expect(mockSetSongs).toHaveBeenCalledWith(["s1", "s3"]);
    });

    test("complete user flow: add, type, add, delete with DOM assertions", async () => {
        render(<Harness initialSongs={["intro"]} />);

        let inputs = screen.getAllByRole("textbox");
        expect(inputs[0]).toHaveValue("intro");

        await userEvent.click(
            screen.getByRole("button", { name: /add song/i }),
        );
        inputs = screen.getAllByRole("textbox");
        expect(inputs[1]).toHaveValue("");
        await userEvent.type(inputs[1], "verse-1");
        await waitFor(() => expect(inputs[1]).toHaveValue("verse-1"));

        await userEvent.click(
            screen.getByRole("button", { name: /add song/i }),
        );
        inputs = screen.getAllByRole("textbox");
        expect(inputs).toHaveLength(3);

        const deleteButtons = screen.getAllByRole("button", { name: "❌" });
        await userEvent.click(deleteButtons[0]);

        inputs = screen.getAllByRole("textbox");
        expect(inputs).toHaveLength(2);
        expect(inputs[0]).toHaveValue("verse-1");
    });

    test("deleting the only song leaves an empty list in the harness", async () => {
        render(<Harness initialSongs={["only-one"]} />);
        await userEvent.click(screen.getByRole("button", { name: "❌" }));
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    test("renders a list item for each song", () => {
        render(
            <EditableSongList songs={["a", "b", "c"]} setSongs={jest.fn()} />,
        );
        const listItems = screen.getAllByRole("listitem");
        expect(listItems.length).toBeGreaterThanOrEqual(3);
    });
});
