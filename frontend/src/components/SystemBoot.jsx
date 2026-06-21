import { useEffect, useState } from 'react';
import { Shield, Cpu, Database, Wifi } from 'lucide-react';

export default function SystemBoot({ onComplete }) {
  const [steps, setSteps] = useState([]);
  const allSteps = [
    { id: 1, text: "INITIALIZING_AEGIS_CORE_V4.2.1", delay: 300 },
    { id: 2, text: "CONNECTING_TO_B_DATABASE... ESTABLISHED", delay: 700 },
    { id: 3, text: "LOADING_NEURAL_WEIGHTS... 100%", delay: 1100 },
    { id: 4, text: "CHECKING_IRIS_SCANNER_ARRAYS... OK", delay: 1500 },
    { id: 5, text: "VERIFYING_SECURE_PROTOCOLS... VALID", delay: 1800 },
    { id: 6, text: "SYSTEM_NOMINAL. WELCOME_ADMIN.", delay: 2200 }
  ];

  useEffect(() => {
    allSteps.forEach(step => {
      setTimeout(() => {
        setSteps(prev => [...prev, step]);
      }, step.delay);
    });

    setTimeout(() => {
      onComplete();
    }, 3000);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-color)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', color: 'var(--text-main)'
    }}>
      <div style={{ position: 'relative', marginBottom: '3rem' }}>
        <Shield size={80} color="var(--primary)" style={{ opacity: 0.2 }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse-border 2s infinite'
        }}>
          <Cpu size={40} color="var(--primary)" />
        </div>
      </div>

      <div style={{ width: '400px', textAlign: 'left' }}>
        {steps.map(step => (
          <div key={step.id} style={{
            color: step.id === 6 ? 'var(--success)' : 'var(--primary)',
            fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.9
          }}>
            <span style={{ marginRight: '1rem' }}>&gt;</span> {step.text}
          </div>
        ))}
        {steps.length < allSteps.length && (
          <div style={{ color: 'var(--primary)', animation: 'pulse-border 0.5s infinite' }}>_</div>
        )}
      </div>

      <div style={{ marginTop: '4rem', display: 'flex', gap: '2rem', opacity: 0.3 }}>
        <Wifi size={20} color="var(--text-main)" />
        <Database size={20} color="var(--text-main)" />
        <Shield size={20} color="var(--text-main)" />
      </div>
    </div>
  );
}
