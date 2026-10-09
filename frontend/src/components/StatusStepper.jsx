import { Check, Circle, XCircle } from 'lucide-react';
import { STEPS } from '../data/reference';

// Pills joined by lines: done = teal, current = dark teal, pending = grey.
// A reopened case is back in field work; a rejected case ends the flow.
function StatusStepper({ status }) {
  if (status === 'Rejected') {
    return (
      <div className="stepper">
        <span className="pill done"><Check size={16} />Submitted</span>
        <span className="line done" />
        <span className="pill current" style={{ background: '#922b21', borderColor: '#922b21' }}>
          <XCircle size={16} />Rejected
        </span>
      </div>
    );
  }

  const effective = status === 'Reopened' ? 'In Progress' : status;
  const currentIndex = STEPS.indexOf(effective);
  // Closed is the terminal step, so show it as completed rather than "current".
  const doneThrough = effective === 'Closed' ? currentIndex + 1 : currentIndex;

  return (
    <div className="stepper">
      {STEPS.map((step, i) => {
        const state = i < doneThrough ? 'done' : i === currentIndex ? 'current' : '';
        return (
          <div key={step} style={{ display: 'contents' }}>
            {i > 0 && <span className={'line ' + (i <= currentIndex ? 'done' : '')} />}
            <span className={'pill ' + state}>
              {state ? <Check size={16} /> : <Circle size={14} />}
              {step === 'Resolved' ? 'Resolved' : step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default StatusStepper;
