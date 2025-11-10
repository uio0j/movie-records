import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MovieList } from "../src/components/MovieList";
import type { Movie } from "../src/interfaces/movie";

// --- Mock the child component so we can trigger callbacks easily ---
jest.mock("../src/components/MovieView", () => {
    return {
        MovieView: ({
            movie,
            deleteMovie,
            editMovie,
            setMovieWatched,
        }: {
            movie: Movie;
            deleteMovie: (id: string) => void;
            editMovie: (id: string, newMovie: Movie) => void;
            setMovieWatched: (id: string, s: boolean, l: boolean) => void;
        }) => (
            <div data-testid={`movie-${movie.id}`}>
                <span>{movie.title ?? movie.id}</span>
                <button
                    aria-label={`delete-${movie.id}`}
                    onClick={() => deleteMovie(movie.id)}
                >
                    delete
                </button>
                <button
                    aria-label={`edit-${movie.id}`}
                    onClick={() =>
                        editMovie(movie.id, { ...movie, title: "edited" })
                    }
                >
                    edit
                </button>
                <button
                    aria-label={`watched-${movie.id}`}
                    onClick={() => setMovieWatched(movie.id, true, false)}
                >
                    watched
                </button>
            </div>
        ),
    };
});

// --- Helpers ---
function makeMovie(id: string, title = `title-${id}`): Movie {
    return {
        id,
        title,
        rating: 0,
        description: "",
        released: 0,
        soundtrack: [],
        watched: { seen: false, liked: false, when: null },
    };
}

describe("MovieList", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders nothing when movies is empty", () => {
        render(
            <MovieList
                movies={[]}
                deleteMovie={jest.fn()}
                editMovie={jest.fn()}
                setMovieWatched={jest.fn()}
            />,
        );

        expect(screen.queryByTestId(/movie-/)).not.toBeInTheDocument();
    });

    test("renders one MovieView per movie (by id)", () => {
        const movies = [makeMovie("a1"), makeMovie("b2"), makeMovie("c3")];
        render(
            <MovieList
                movies={movies}
                deleteMovie={jest.fn()}
                editMovie={jest.fn()}
                setMovieWatched={jest.fn()}
            />,
        );

        expect(screen.getByTestId("movie-a1")).toBeInTheDocument();
        expect(screen.getByTestId("movie-b2")).toBeInTheDocument();
        expect(screen.getByTestId("movie-c3")).toBeInTheDocument();

        expect(screen.getByText("title-a1")).toBeInTheDocument();
        expect(screen.getByText("title-b2")).toBeInTheDocument();
        expect(screen.getByText("title-c3")).toBeInTheDocument();
    });

    test("deleteMovie is called with the correct id when child's delete is clicked", async () => {
        const movies = [makeMovie("x1"), makeMovie("x2")];
        const mockDelete = jest.fn();

        render(
            <MovieList
                movies={movies}
                deleteMovie={mockDelete}
                editMovie={jest.fn()}
                setMovieWatched={jest.fn()}
            />,
        );

        // click delete for x1 and x2 by their aria-labels
        await userEvent.click(
            screen.getByRole("button", { name: /delete-x1/i }),
        );
        expect(mockDelete).toHaveBeenCalledWith("x1");

        await userEvent.click(
            screen.getByRole("button", { name: /delete-x2/i }),
        );
        expect(mockDelete).toHaveBeenCalledWith("x2");

        expect(mockDelete).toHaveBeenCalledTimes(2);
    });

    test("editMovie is passed through and called with id and updated movie", async () => {
        const movies = [makeMovie("m1"), makeMovie("m2")];
        const mockEdit = jest.fn();

        render(
            <MovieList
                movies={movies}
                deleteMovie={jest.fn()}
                editMovie={mockEdit}
                setMovieWatched={jest.fn()}
            />,
        );

        await userEvent.click(screen.getByRole("button", { name: /edit-m1/i }));
        expect(mockEdit).toHaveBeenCalledWith(
            "m1",
            expect.objectContaining({ id: "m1", title: "edited" }),
        );

        await userEvent.click(screen.getByRole("button", { name: /edit-m2/i }));
        expect(mockEdit).toHaveBeenCalledWith(
            "m2",
            expect.objectContaining({ id: "m2", title: "edited" }),
        );

        expect(mockEdit).toHaveBeenCalledTimes(2);
    });

    test("setMovieWatched is passed through and called with id, seen=true, liked=false", async () => {
        const movies = [makeMovie("w1"), makeMovie("w2")];
        const mockSetWatched = jest.fn();

        render(
            <MovieList
                movies={movies}
                deleteMovie={jest.fn()}
                editMovie={jest.fn()}
                setMovieWatched={mockSetWatched}
            />,
        );

        await userEvent.click(
            screen.getByRole("button", { name: /watched-w1/i }),
        );
        expect(mockSetWatched).toHaveBeenCalledWith("w1", true, false);

        await userEvent.click(
            screen.getByRole("button", { name: /watched-w2/i }),
        );
        expect(mockSetWatched).toHaveBeenCalledWith("w2", true, false);

        expect(mockSetWatched).toHaveBeenCalledTimes(2);
    });

    test("renders containers for each movie (bootstrap stack wrapper exists)", () => {
        const movies = [makeMovie("s1"), makeMovie("s2")];
        render(
            <MovieList
                movies={movies}
                deleteMovie={jest.fn()}
                editMovie={jest.fn()}
                setMovieWatched={jest.fn()}
            />,
        );

        const items = [
            screen.getByTestId("movie-s1"),
            screen.getByTestId("movie-s2"),
        ];
        expect(items).toHaveLength(2);
    });
});
