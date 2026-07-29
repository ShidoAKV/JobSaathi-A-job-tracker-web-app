const cards = [
  {
    title: "Applications",
    value: 24,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Interviews",
    value: 8,
    color: "from-yellow-500 to-orange-500",
  },
  {
    title: "Offers",
    value: 2,
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Rejected",
    value: 6,
    color: "from-red-500 to-pink-500",
  },
];

const InsightsCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

      {cards.map((card) => (
        <div
          key={card.title}
          className={`bg-gradient-to-r ${card.color} rounded-2xl p-6 text-white shadow-lg`}
        >
          <h3 className="text-lg">{card.title}</h3>

          <p className="text-4xl font-bold mt-4">
            {card.value}
          </p>

        </div>
      ))}

    </div>
  );
};

export default InsightsCards;