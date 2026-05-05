import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/ui/MobileHeader';
import { ArrowLeft, Calendar, User, RefreshCw, ChevronRight, Clock } from 'lucide-react';

const WeekConsultations = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchWeekConsultations = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Fetch patient IDs for this nutritionist
      const { data: patients, error: pError } = await supabase
        .from('pacientes')
        .select('id, nome')
        .eq('nutricionista_id', user.id);

      if (pError) throw pError;
      const patientMap = patients.reduce((acc, p) => ({ ...acc, [p.id]: p.nome }), {});
      const patientIds = patients.map(p => p.id);

      if (patientIds.length > 0) {
        const { data, error } = await supabase
          .from('consultas')
          .select('*')
          .in('paciente_id', patientIds)
          .gte('data_consulta', startOfWeek.toISOString().split('T')[0])
          .lte('data_consulta', endOfWeek.toISOString().split('T')[0])
          .order('data_consulta', { ascending: true });

        if (error) throw error;
        
        const enrichedConsultations = data.map(c => ({
          ...c,
          patientName: patientMap[c.paciente_id] || 'Paciente Desconhecido'
        }));

        setConsultations(enrichedConsultations);
      }
    } catch (error) {
      console.error('Erro ao buscar consultas da semana:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWeekConsultations();
    }
  }, [user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="dashboard-layout">
      <MobileHeader isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="main-content">
        <header style={{ marginBottom: '2rem' }}>
          <Link to="/dashboard" className="nav-item" style={{ width: 'fit-content', marginBottom: '1rem', padding: '0.5rem 0' }}>
            <ArrowLeft size={20} /> Voltar para Dashboard
          </Link>
          <h1 style={{ color: 'var(--gray-800)', fontSize: '1.875rem', fontWeight: '700' }}>Agenda da Semana</h1>
          <p style={{ color: 'var(--gray-600)' }}>Todas as consultas marcadas para esta semana.</p>
        </header>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <RefreshCw className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : consultations.length === 0 ? (
          <div className="auth-card" style={{ maxWidth: 'none', textAlign: 'center', padding: '3rem' }}>
            <Calendar size={48} style={{ color: 'var(--gray-200)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--gray-600)', fontSize: '1.125rem' }}>
              Nenhuma consulta marcada para esta semana.
            </p>
          </div>
        ) : (
          <div className="consultations-grid">
            {consultations.map(consult => (
              <Link key={consult.id} to={`/pacientes/${consult.paciente_id}`} className="consultation-card">
                <div className="consult-date-badge">
                  {formatDate(consult.data_consulta)}
                </div>
                <div className="consult-content">
                  <div className="consult-info">
                    <User size={18} style={{ color: 'var(--primary)' }} />
                    <span className="patient-name">{consult.patientName}</span>
                  </div>
                  {consult.proximo_retorno && (
                    <div className="consult-info" style={{ marginTop: '0.4rem', color: 'var(--primary-dark)', opacity: 0.9 }}>
                      <Clock size={14} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: '500' }}>Próximo Retorno: {new Date(consult.proximo_retorno).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
                <ChevronRight size={20} style={{ color: 'var(--gray-200)' }} />
              </Link>
            ))}
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .consultations-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .consultation-card {
          background: var(--white);
          padding: 1.25rem;
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 1.5rem;
          text-decoration: none;
          transition: all 0.2s;
        }
        .consultation-card:hover {
          transform: translateX(8px);
          border-color: var(--primary);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .consult-date-badge {
          background-color: var(--primary-light);
          color: var(--primary-dark);
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-weight: 700;
          font-size: 0.875rem;
          text-transform: capitalize;
          min-width: 140px;
          text-align: center;
        }
        .consult-content {
          flex: 1;
        }
        .consult-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .patient-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--gray-800);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .consultation-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .consult-date-badge {
            width: 100%;
          }
        }
        @media (max-width: 768px) {
          header h1 {
            font-size: 1.5rem !important;
          }
        }
      `}} />
    </div>
  );
};

export default WeekConsultations;
