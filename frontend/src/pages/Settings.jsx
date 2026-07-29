import ProfileCard from "../components/settings/ProfileCard";
import SecurityCard from "../components/settings/SecurityCard";

const Settings = () => {
  return (
    <div className="space-y-8 transition-colors duration-300">

      <ProfileCard />

      <SecurityCard />

    </div>
  );
};

export default Settings;