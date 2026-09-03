import './LoadingOverlay.css';
import { Loader } from 'lucide-react';

export default function LoadingOverlay({ message = 'Processing...', steps = [], currentStep = 0 }) {
  return (
    <div className="loading-overlay">
      <div className="loading-card glass-card animate-scale-in">
        <div className="loading-spinner-wrap">
          <div className="loading-ring" />
          <Loader size={24} className="loading-icon animate-spin" />
        </div>
        <p className="loading-message">{message}</p>
        {steps.length > 0 && (
          <div className="loading-steps">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`loading-step ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}
              >
                <div className="loading-step-dot" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
