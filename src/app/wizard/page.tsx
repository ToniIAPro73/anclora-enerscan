import AssessmentWizard from '@/components/AssessmentWizard';
import Navbar from '@/components/Navbar';

export default function WizardPage() {
  return (
    <div className="min-h-screen app-shell overflow-x-hidden lg:h-screen lg:overflow-hidden">
      <Navbar />
      <div className="pt-20 lg:h-[calc(100vh-4rem)] lg:pt-16 lg:overflow-hidden">
        <AssessmentWizard />
      </div>
    </div>
  );
}
