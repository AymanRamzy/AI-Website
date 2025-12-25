import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

function CheckEmail() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-modex-primary via-modex-secondary to-modex-accent flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Logo - Platform Level */}
          <h1 className="text-4xl font-black text-modex-primary mb-8">
            Mod<span className="text-modex-secondary">EX</span>
          </h1>

          {/* Email Icon */}
          <div className="bg-modex-light rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Mail className="w-12 h-12 text-modex-secondary" />
          </div>

          {/* Message */}
          <h3 className="text-2xl font-bold text-modex-primary mb-4">Check Your Email</h3>
          <p className="text-gray-600 mb-6">
            We&apos;ve sent a confirmation link to your email address. 
            Please click the link to verify your account and complete registration.
          </p>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-blue-800 text-sm">
              <strong>Didn&apos;t receive the email?</strong>
              <br />
              • Check your spam/junk folder
              <br />
              • Make sure you entered the correct email
              <br />
              • Wait a few minutes and try again
            </p>
          </div>

          {/* Back to Sign In */}
          <Link
            to="/signin"
            className="inline-flex items-center text-modex-secondary font-bold hover:text-modex-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CheckEmail;
