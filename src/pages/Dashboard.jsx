import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/ui/MobileHeader';
import { Users, Calendar, AlertCircle, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    weekConsultations: 0,
    patientsWithoutReturn: []
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Total Patients
      const { count: patientCount, error: err1 } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .eq('nutricionista_id', user.id);

      if (err1) throw err1;

      // 2. Consultations of the week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // We need to fetch patient IDs first to filter consultations by nutritionist
      const { data: nutritionistPatients, error: err2 } = await supabase
        .from('pacientes')
        .select('id')
        .eq('nutricionista_id', user.id);

      if (err2) throw err2;
      const patientIds = nutritionistPatients.map(p => p.id);

      let weekCount = 0;
      if (patientIds.length > 0) {
        const { count, error: err3 } = await supabase
          .from('consultas')
          .select('*', { count: 'exact', head: true })
          .in('paciente_id', patientIds)
          .gte('data_consulta', startOfWeek.toISOString().split('T')[0])
          .lte('data_consulta', endOfWeek.toISOString().split('T')[0]);

        if (err3) throw err3;
        weekCount = count || 0;
      }

      // 3. Patients without follow-up
      // Logic: Last consultation > 30 days ago AND no upcoming return
      const { data: patientsData, error: err4 } = await supabase
        .from('pacientes')
        .select(`
          id,
          nome,
          consultas (
            data_consulta,
            proximo_retorno
          )
        `)
        .eq('nutricionista_id', user.id);

      if (err4) throw err4;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const now = new Date();

      const withoutReturn = patientsData.filter(p => {
        if (!p.consultas || p.consultas.length === 0) return false;

        // Find last consultation
        const lastConsulta = p.consultas.reduce((latest, current) => {
          return new Date(current.data_consulta) > new Date(latest.data_consulta) ? current : latest;
        }, p.consultas[0]);

        const lastDate = new Date(lastConsulta.data_consulta);

        // Check if any return is scheduled for the future
        const hasUpcomingReturn = p.consultas.some(c =>
          c.proximo_retorno && new Date(c.proximo_retorno) > now
        );

        return lastDate < thirtyDaysAgo && !hasUpcomingReturn;
      });

      setStats({
        totalPatients: patientCount || 0,
        weekConsultations: weekCount,
        patientsWithoutReturn: withoutReturn
      });

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  return (
    <div className="dashboard-layout">
      <MobileHeader isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="main-content">
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--gray-800)', fontSize: '1.875rem', fontWeight: '700' }}>
            Olá, {user?.user_metadata?.nome || 'Nutricionista'}!
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>Bem-vinda ao seu painel de controle.</p>
        </header>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <RefreshCw className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : (
          <div className="stats-grid">
            {/* Card 1: Total Patients */}
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Total de Pacientes</span>
                <div className="stat-icon">
                  <Users size={20} />
                </div>
              </div>
              <div className="stat-value">{stats.totalPatients}</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
                Pacientes ativos no sistema
              </p>
            </div>

            {/* Card 2: Week Consultations */}
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Consultas da Semana</span>
                <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0ea5e9' }}>
                  <Calendar size={20} />
                </div>
              </div>
              <div className="stat-value">{stats.weekConsultations}</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
                Agendadas para esta semana
              </p>
            </div>

            {/* Card 3: Patients without return */}
            <div className="stat-card" style={{ gridColumn: 'span 1' }}>
              <div className="stat-header">
                <span className="stat-title">Pacientes sem retorno</span>
                <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                  <AlertCircle size={20} />
                </div>
              </div>

              {stats.patientsWithoutReturn.length === 0 ? (
                <p className="empty-state">Nenhum paciente sem retorno no momento</p>
              ) : (
                <ul className="patient-list">
                  {stats.patientsWithoutReturn.slice(0, 5).map(patient => (
                    <li key={patient.id} className="patient-item">
                      <Link to={`/pacientes/${patient.id}`} className="patient-link">
                        {patient.nome}
                      </Link>
                    </li>
                  ))}
                  {stats.patientsWithoutReturn.length > 5 && (
                    <li className="patient-item">
                      <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        E mais {stats.patientsWithoutReturn.length - 5} pacientes...
                      </span>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
