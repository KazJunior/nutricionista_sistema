import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/ui/MobileHeader';
import { Plus, Search, User, Calendar, Target, RefreshCw, ChevronRight } from 'lucide-react';

const Patients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      // Fetch patients and their last consultation
      const { data, error } = await supabase
        .from('pacientes')
        .select(`
          id,
          nome,
          objetivo_texto,
          objetivos,
          consultas (
            data_consulta
          )
        `)
        .eq('nutricionista_id', user.id)
        .order('nome');

      if (error) throw error;

      // Process data to get the last consultation date
      const processedPatients = data.map(p => {
        const lastConsulta = p.consultas && p.consultas.length > 0
          ? p.consultas.reduce((latest, current) => 
              new Date(current.data_consulta) > new Date(latest.data_consulta) ? current : latest
            ).data_consulta
          : null;
        
        return {
          ...p,
          lastConsulta,
          // Get first objective from array or the free text
          displayGoal: p.objetivos && p.objetivos.length > 0 
            ? p.objetivos[0] 
            : (p.objetivo_texto || 'Não informado')
        };
      });

      setPatients(processedPatients);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user]);

  const filteredPatients = patients.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca consultou';
    const date = new Date(dateString);
    // Add offset because JS Date can shift days when parsing YYYY-MM-DD
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="dashboard-layout">
      <MobileHeader isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: 'var(--gray-800)', fontSize: '1.875rem', fontWeight: '700' }}>Pacientes</h1>
            <p style={{ color: 'var(--gray-600)' }}>Gerencie seus pacientes cadastrados.</p>
          </div>
          <Link to="/pacientes/novo" className="btn btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> Novo Paciente
          </Link>
        </header>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-600)' }} />
          <input 
            type="text" 
            placeholder="Buscar paciente por nome..." 
            className="form-input" 
            style={{ paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <RefreshCw className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="auth-card" style={{ maxWidth: 'none', textAlign: 'center', padding: '3rem' }}>
            <User size={48} style={{ color: 'var(--gray-200)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--gray-600)', fontSize: '1.125rem' }}>
              {searchTerm ? 'Nenhum paciente encontrado para esta busca.' : 'Nenhum paciente cadastrado ainda.'}
            </p>
            {!searchTerm && (
              <Link to="/pacientes/novo" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none', marginTop: '1rem', display: 'inline-block' }}>
                Cadastrar meu primeiro paciente
              </Link>
            )}
          </div>
        ) : (
          <div className="patient-grid">
            {filteredPatients.map(patient => (
              <Link key={patient.id} to={`/pacientes/${patient.id}`} className="patient-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div className="patient-avatar">
                    {patient.nome.charAt(0).toUpperCase()}
                  </div>
                  <ChevronRight size={20} style={{ color: 'var(--gray-200)' }} />
                </div>
                
                <h3 className="patient-name">{patient.nome}</h3>
                
                <div className="patient-info">
                  <Target size={16} />
                  <span>{patient.displayGoal}</span>
                </div>
                
                <div className="patient-info">
                  <Calendar size={16} />
                  <span>Última consulta: {formatDate(patient.lastConsulta)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .patient-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .patient-card {
          background: var(--white);
          padding: 1.5rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border: 1px solid var(--border-color);
          text-decoration: none;
          transition: all 0.2s;
          display: block;
        }
        .patient-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border-color: var(--primary);
        }
        .patient-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: var(--primary-light);
          color: var(--primary-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.25rem;
        }
        .patient-name {
          color: var(--gray-800);
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }
        .patient-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--gray-600);
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .patient-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 1rem;
          }
          header .btn {
            width: 100% !important;
          }
        }
      `}} />
    </div>
  );
};

export default Patients;
