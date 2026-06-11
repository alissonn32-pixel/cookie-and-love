import { describe, it, expect, vi } from "vitest";
import { getAllReviews, setReviewApproved } from "./reviews";
import { SupabaseClient } from "@supabase/supabase-js";
import { Review } from "./types";

function mockSelectClient(rows: unknown[] | null, error: unknown = null) {
  const order = vi.fn().mockResolvedValue({ data: rows, error });
  const select = vi.fn().mockReturnValue({ order });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as SupabaseClient;
}

function mockUpdateClient(error: unknown = null) {
  const eq = vi.fn().mockResolvedValue({ error });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });
  return { from } as unknown as SupabaseClient;
}

const reviewRow = {
  id: "11111111-1111-1111-1111-111111111111",
  customer_name: "Maria Silva",
  rating: 5,
  comment: "Cookies maravilhosos, chegaram quentinhos!",
  approved: false,
  created_at: "2026-06-10T18:00:00.000Z",
};

const mappedReview: Review = {
  id: "11111111-1111-1111-1111-111111111111",
  customerName: "Maria Silva",
  rating: 5,
  comment: "Cookies maravilhosos, chegaram quentinhos!",
  approved: false,
  createdAt: "2026-06-10T18:00:00.000Z",
};

describe("getAllReviews", () => {
  it("maps database rows to Review objects, ordered by most recent", async () => {
    const client = mockSelectClient([reviewRow]);

    const reviews = await getAllReviews(client);

    expect(reviews).toEqual([mappedReview]);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("reviews");

    const selectMock = fromMock.mock.results[0].value.select as ReturnType<typeof vi.fn>;
    expect(selectMock).toHaveBeenCalledWith("*");

    const orderMock = selectMock.mock.results[0].value.order as ReturnType<typeof vi.fn>;
    expect(orderMock).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("maps an approved review through unchanged", async () => {
    const client = mockSelectClient([{ ...reviewRow, approved: true }]);

    const reviews = await getAllReviews(client);

    expect(reviews[0].approved).toBe(true);
  });

  it("throws an error when the query returns an error", async () => {
    const client = mockSelectClient(null, new Error("db error"));

    await expect(getAllReviews(client)).rejects.toThrow("db error");
  });
});

describe("setReviewApproved", () => {
  it("updates the approved field for the row matching the id", async () => {
    const client = mockUpdateClient();

    await setReviewApproved(client, "11111111-1111-1111-1111-111111111111", true);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    expect(fromMock).toHaveBeenCalledWith("reviews");

    const updateMock = fromMock.mock.results[0].value.update as ReturnType<typeof vi.fn>;
    expect(updateMock).toHaveBeenCalledWith({ approved: true });

    const eqMock = updateMock.mock.results[0].value.eq as ReturnType<typeof vi.fn>;
    expect(eqMock).toHaveBeenCalledWith("id", "11111111-1111-1111-1111-111111111111");
  });

  it("can set approved back to false", async () => {
    const client = mockUpdateClient();

    await setReviewApproved(client, "11111111-1111-1111-1111-111111111111", false);

    const fromMock = client.from as unknown as ReturnType<typeof vi.fn>;
    const updateMock = fromMock.mock.results[0].value.update as ReturnType<typeof vi.fn>;
    expect(updateMock).toHaveBeenCalledWith({ approved: false });
  });

  it("throws an error when the update returns an error", async () => {
    const client = mockUpdateClient(new Error("db error"));

    await expect(
      setReviewApproved(client, "11111111-1111-1111-1111-111111111111", true)
    ).rejects.toThrow("db error");
  });
});
