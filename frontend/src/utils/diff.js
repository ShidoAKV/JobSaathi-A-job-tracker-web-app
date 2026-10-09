/**
 * Line-level diff (LCS). Returns ops: { type: "equal" | "add" | "del", text }.
 * Resumes are a few hundred lines at most, so the O(n*m) table is fine.
 */
export const diffLines = (before = "", after = "") => {
  const a = before.split("\n");
  const b = after.split("\n");
  const n = a.length;
  const m = b.length;

  const table = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "equal", text: a[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      ops.push({ type: "del", text: a[i] });
      i += 1;
    } else {
      ops.push({ type: "add", text: b[j] });
      j += 1;
    }
  }
  while (i < n) ops.push({ type: "del", text: a[i++] });
  while (j < m) ops.push({ type: "add", text: b[j++] });

  return ops;
};

export const diffStats = (ops) =>
  ops.reduce(
    (acc, op) => {
      if (op.type === "add") acc.added += 1;
      if (op.type === "del") acc.removed += 1;
      return acc;
    },
    { added: 0, removed: 0 }
  );
