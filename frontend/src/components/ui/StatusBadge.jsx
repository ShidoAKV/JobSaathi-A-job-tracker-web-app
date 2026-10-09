const classes = {
  Applied: "badge-applied",
  Interview: "badge-interview",
  Offer: "badge-offer",
  Rejected: "badge-rejected",
};

const StatusBadge = ({ status }) => (
  <span className={classes[status] || "badge bg-surface-3 text-fg-muted"}>
    {status}
  </span>
);

export default StatusBadge;
