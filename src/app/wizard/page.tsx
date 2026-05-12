import AssessmentWizard from '@/components/AssessmentWizard';
import Navbar from '@/components/Navbar';

export default function WizardPage() {
  return (
    <div className="min-h-screen app-shell">
      <Navbar />
      <div className="pt-20">
        <AssessmentWizard />
      </div>
    </div>
  );
}
