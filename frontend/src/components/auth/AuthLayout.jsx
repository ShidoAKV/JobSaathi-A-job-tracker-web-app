import professional from "../../assets/images/icons/WP.jpeg";
const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen grid grid-cols-2 bg-slate-100">

      {/* Left Section */}
      <div className="flex flex-col justify-center px-20 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white relative overflow-hidden">
        {/* Background Blur Circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10"></div>

        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/10"></div>

        <div className="relative z-10">
 

          <h1 className="text-6xl font-extrabold">
            JobSathi
          </h1>

          <p className="mt-6 text-xl text-blue-100 leading-9">
            Organize your job applications,
            prepare for interviews and
            land your dream job.
          </p>

          <div className="mt-12 space-y-6">

  <div className="flex items-center gap-3">
    <span className="text-2xl">🚀</span>
    <p className="text-lg">Track Job Applications</p>
  </div>

  <div className="flex items-center gap-3">
    <span className="text-2xl">📊</span>
    <p className="text-lg">Manage Interview Pipeline</p>
  </div>

  <div className="flex items-center gap-3">
    <span className="text-2xl">💼</span>
    <p className="text-lg">Organize Every Opportunity</p>
  </div>

  <div className="flex items-center gap-3">
    <span className="text-2xl">🏆</span>
    <p className="text-lg">Land Your Dream Offer</p>
  </div>

</div>

        </div>

      </div>

      {/* Right Section */}
      {/* Right Section */}
<div className="relative flex justify-center items-center p-8 overflow-hidden">

  {/* Background Image */}
  <img
    src={professional}
    alt="Professional"
    className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[1px]"
  />

  {/* Optional blue overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"></div>

  {/* Login / Signup Form */}
  <div className="relative z-10">
    {children}
  </div>

</div>

    </div>
  );
};

export default AuthLayout;