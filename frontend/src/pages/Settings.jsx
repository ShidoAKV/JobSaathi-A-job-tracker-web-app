import ProfileCard from "../components/settings/ProfileCard";
import SecurityCard from "../components/settings/SecurityCard";
import AccountTypeCard from "../components/settings/AccountTypeCard";

const Settings = () => (
  <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
    <div className="xl:col-span-3 space-y-6">
      <ProfileCard />
      <SecurityCard />
    </div>
    <div className="xl:col-span-2">
      <AccountTypeCard />
    </div>
  </div>
);

export default Settings;
