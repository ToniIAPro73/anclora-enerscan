import AssessmentWizard from '@/components/AssessmentWizard';
import Navbar from '@/components/Navbar';

export default function WizardPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <div className="pt-24">
        <AssessmentWizard />
      </div>
    </div>
  );
}
