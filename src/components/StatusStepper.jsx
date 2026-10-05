import { Check, Circle } from 'lucide-react';
import { STEPS } from '../data/mockData';

// Pills joined by lines: done = teal, current = dark teal, pending = grey
function StatusStepper({ status }) {
  const currentIndex = STEPS.indexOf(status);

  return (
    <div className="stepper">
      {STEPS.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : '';
        return (
          <div key={step} style={{ display: 'contents' }}>
            {i > 0 && <span className={'line ' + (i <= currentIndex ? 'done' : '')} />}
            <span className={'pill ' + state}>
              {state ? <Check size={16} /> : <Circle size={14} />}
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default StatusStepper;
