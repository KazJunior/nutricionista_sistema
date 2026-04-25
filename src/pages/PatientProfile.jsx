import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/ui/MobileHeader';
import { ArrowLeft, User, Phone, Target, Ruler, Weight, Calendar, RefreshCw } from 'lucide-react';

const PatientProfile = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pacientes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setPatient(data);
      } catch (error) {
        console.error('Erro ao buscar paciente:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Não informada';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} anos`;
  };

  return (
    <div className="dashboard-layout">
      <MobileHeader isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="main-content">
        <header style={{ marginBottom: '2rem' }}>
          <Link to="/pacientes" className="nav-item" style={{ width: 'fit-content', marginBottom: '1rem', padding: '0.5rem 0' }}>
            <ArrowLeft size={20} />
            Voltar para listagem
          </Link>
          <h1 style={{ color: 'var(--gray-800)', fontSize: '1.875rem', fontWeight: '700' }}>
            {loading ? 'Carregando...' : patient?.nome}
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>Informações detalhadas do paciente.</p>
        </header>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <RefreshCw className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : patient ? (
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {/* Informações Pessoais */}
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Dados Pessoais</span>
                <div className="stat-icon"><User size={20} /></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="profile-field">
                  <Phone size={18} />
                  <div>
                    <label>WhatsApp</label>
                    <p>{patient.whatsapp || 'Não informado'}</p>
                  </div>
                </div>
                <div className="profile-field">
                  <Calendar size={18} />
                  <div>
                    <label>Idade</label>
                    <p>{calculateAge(patient.data_nascimento)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Objetivos e Clínica */}
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Objetivo e Medidas</span>
                <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0ea5e9' }}>
                  <Target size={20} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="profile-field">
                  <Target size={18} />
                  <div>
                    <label>Objetivo</label>
                    <p>{patient.objetivos?.[0] || patient.objetivo_texto || 'Não informado'}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="profile-field">
                    <Weight size={18} />
                    <div>
                      <label>Peso</label>
                      <p>{patient.peso_inicial ? `${patient.peso_inicial} kg` : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="profile-field">
                    <Ruler size={18} />
                    <div>
                      <label>Altura</label>
                      <p>{patient.altura ? `${patient.altura} cm` : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="auth-card" style={{ maxWidth: 'none', textAlign: 'center' }}>
            <p>Paciente não encontrado.</p>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .profile-field {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          color: var(--gray-600);
        }
        .profile-field label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--gray-600);
          margin-bottom: 0.125rem;
        }
        .profile-field p {
          font-size: 1rem;
          font-weight: 500;
          color: var(--gray-800);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default PatientProfile;
