import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { z } from 'zod';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/ui/MobileHeader';
import { 
  ArrowLeft, User, Phone, Target, Ruler, Weight, Calendar, 
  RefreshCw, Save, Activity, Coffee, Plus, ChevronRight, 
  FileText, TrendingUp, AlertCircle, Check, X, Sparkles, Trash2, Edit3,
  Sun, Sunset, Sunrise
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// --- SCHEMA DE VALIDAÇÃO DO PLANO ALIMENTAR ---
const MealSchema = z.array(z.string().min(1)).length(5);
const PlanSchema = z.object({
  plano_semanal: z.array(z.object({
    dia: z.string(),
    refeicoes: z.object({
      cafe_da_manha: MealSchema,
      lanche_manha: MealSchema,
      almoco: MealSchema,
      lanche_tarde: MealSchema,
      jantar: MealSchema,
    })
  })).length(7)
});

const PatientProfile = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Tab states
  const [activeMainTab, setActiveMainTab] = useState('dados'); // 'dados', 'consultas', 'planos'
  const [activeDataTab, setActiveDataTab] = useState('pessoal'); // 'pessoal', 'clinico', 'habitos'
  
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // AI Plan states
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null); // The plan being generated/edited
  const [showPlanView, setShowPlanView] = useState(false); // Whether to show the generation/editing screen
  const [selectedHistoryPlan, setSelectedHistoryPlan] = useState(null); // Plan selected from history
  const [activeDayIndex, setActiveDayIndex] = useState(0); // Day currently being viewed/edited in the plan

  // Form states for patient data
  const [formData, setFormData] = useState({});

  // Form state for new consultation
  const [newConsultation, setNewConsultation] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: ''
  });

  // Options from PatientForm
  const objetivoOptions = ['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'];
  const atividadeOptions = ['Sedentário', 'Levemente ativo', 'Moderadamente ativo', 'Muito ativo', 'Extremamente ativo'];
  const patologiaOptions = ['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'];
  const restricaoOptions = ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'];
  const alergiaOptions = ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'];

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Patient
      const { data: patientData, error: patientError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);
      setFormData(patientData);

      // Fetch Consultations
      const { data: consultData, error: consultError } = await supabase
        .from('consultas')
        .select('*')
        .eq('paciente_id', id)
        .order('data_consulta', { ascending: false });

      if (consultError) throw consultError;
      setConsultations(consultData);

      // Fetch Meal Plans
      const { data: planData, error: planError } = await supabase
        .from('planos_alimentares')
        .select('*')
        .eq('paciente_id', id)
        .order('created_at', { ascending: false });

      if (planError) throw planError;
      setMealPlans(planData);

    } catch (err) {
      console.error('Erro ao buscar dados:', err.message);
      setError('Erro ao carregar dados do paciente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => {
      const current = prev[field] || [];
      if (value === 'Nenhum') {
        return { ...prev, [field]: ['Nenhum'] };
      }
      
      const newSelection = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current.filter(item => item !== 'Nenhum'), value];
      
      return { ...prev, [field]: newSelection };
    });
  };

  const handleSavePatient = async () => {
    try {
      setSaving(true);
      setError('');
      const { error: updateError } = await supabase
        .from('pacientes')
        .update(formData)
        .eq('id', id);

      if (updateError) throw updateError;
      
      setSuccess('Dados atualizados com sucesso!');
      setPatient(formData);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err.message);
      setError('Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConsultation = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { error: insertError } = await supabase
        .from('consultas')
        .insert([{
          ...newConsultation,
          paciente_id: id,
          peso: newConsultation.peso ? parseFloat(newConsultation.peso) : null,
          cintura: newConsultation.cintura ? parseFloat(newConsultation.cintura) : null,
          quadril: newConsultation.quadril ? parseFloat(newConsultation.quadril) : null,
          percentual_gordura: newConsultation.percentual_gordura ? parseFloat(newConsultation.percentual_gordura) : null,
        }]);

      if (insertError) throw insertError;

      setSuccess('Consulta salva com sucesso!');
      setShowConsultationModal(false);
      setNewConsultation({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: ''
      });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar consulta:', err.message);
      setError('Erro ao salvar consulta.');
    } finally {
      setSaving(false);
    }
  };

  // AI MEAL PLAN FUNCTIONS
  const handleGeneratePlan = async () => {
    try {
      setGeneratingPlan(true);
      setShowPlanView(true);
      setError('');
      
      const patientData = {
        nome: patient.nome,
        objetivos: patient.objetivos,
        objetivo_texto: patient.objetivo_texto,
        restricoes: patient.restricoes_alimentares,
        alergias: patient.alergias,
        patologias: patient.patologias,
        habitos: {
          refeicoes_por_dia: patient.refeicoes_por_dia,
          agua: patient.litros_agua,
          acorda: patient.horario_acorda,
          dorme: patient.horario_dorme,
          atividade: patient.atividade_fisica_descricao
        }
      };

      const { data, error: genError } = await supabase.functions.invoke('gerar-plano-final', {
        body: { patientData }
      });

      if (genError) throw genError;
      if (data.error) throw new Error(data.error);

      setCurrentPlan(data.plano_semanal);
      setSuccess('Plano alimentar gerado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao gerar plano:', err.message);
      setError('Erro ao gerar plano alimentar. Verifique sua conexão e chave de API.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleMealChange = (dayIndex, mealKey, itemIndex, newValue) => {
    const updatedPlan = [...currentPlan];
    updatedPlan[dayIndex].refeicoes[mealKey][itemIndex] = newValue;
    setCurrentPlan(updatedPlan);
  };

  const handleSaveMealPlan = async () => {
    try {
      setSaving(true);
      
      // Validação com Zod antes de salvar
      const validation = PlanSchema.safeParse({ plano_semanal: currentPlan });
      
      if (!validation.success) {
        console.error('Erro de validação:', validation.error);
        throw new Error('O plano alimentar está incompleto ou fora do padrão (cada refeição deve ter 5 itens).');
      }

      const { error: saveError } = await supabase
        .from('planos_alimentares')
        .insert([{
          paciente_id: id,
          conteudo: { plano_semanal: currentPlan }
        }]);

      if (saveError) throw saveError;

      setSuccess('Plano alimentar salvo com sucesso!');
      setShowPlanView(false);
      setCurrentPlan(null);
      fetchData(); // Refresh history
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar plano:', err.message);
      setError('Erro ao salvar plano alimentar.');
    } finally {
      setSaving(false);
    }
  };

  const chartData = useMemo(() => {
    if (!consultations.length) return [];
    return [...consultations]
      .reverse()
      .map(c => ({
        data: new Date(c.data_consulta).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        peso: parseFloat(c.peso)
      }));
  }, [consultations]);

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading && !patient) {
    return (
      <div className="dashboard-layout">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <RefreshCw className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <MobileHeader isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="main-content">
        <header style={{ marginBottom: '2rem' }}>
          <Link to="/pacientes" className="nav-item" style={{ width: 'fit-content', marginBottom: '1rem', padding: '0.5rem 0' }}>
            <ArrowLeft size={20} /> Voltar para listagem
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ color: 'var(--gray-800)', fontSize: '2rem', fontWeight: '800' }}>
                {patient?.nome}
              </h1>
              <p style={{ color: 'var(--gray-600)' }}>
                {patient?.sexo} • {calculateAge(patient?.data_nascimento)} anos • {patient?.email}
              </p>
            </div>
            {activeMainTab === 'dados' && (
              <button 
                className="btn btn-primary" 
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleSavePatient}
                disabled={saving}
              >
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Salvar Alterações
              </button>
            )}
          </div>
        </header>

        {success && <div className="alert fade-in" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={18} /> {success}</div>}
        {error && <div className="alert alert-error fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18} /> {error}</div>}

        {/* TOP-LEVEL TABS */}
        <div className="main-tabs-nav">
          <button className={`main-tab-link ${activeMainTab === 'dados' ? 'active' : ''}`} onClick={() => setActiveMainTab('dados')}>
            <User size={18} /> Dados do Paciente
          </button>
          <button className={`main-tab-link ${activeMainTab === 'consultas' ? 'active' : ''}`} onClick={() => setActiveMainTab('consultas')}>
            <Activity size={18} /> Consultas
          </button>
          <button className={`main-tab-link ${activeMainTab === 'planos' ? 'active' : ''}`} onClick={() => setActiveMainTab('planos')}>
            <Coffee size={18} /> Planos Alimentares
          </button>
        </div>

        <div className="main-tab-content">
          {/* SECTION 1: DADOS DO PACIENTE */}
          {activeMainTab === 'dados' && (
            <section className="fade-in">
              <div className="card-tabs">
                <div className="tabs-nav">
                  <button className={`tab-link ${activeDataTab === 'pessoal' ? 'active' : ''}`} onClick={() => setActiveDataTab('pessoal')}>Pessoal</button>
                  <button className={`tab-link ${activeDataTab === 'clinico' ? 'active' : ''}`} onClick={() => setActiveDataTab('clinico')}>Clínico</button>
                  <button className={`tab-link ${activeDataTab === 'habitos' ? 'active' : ''}`} onClick={() => setActiveDataTab('habitos')}>Hábitos</button>
                </div>

                <div className="tab-content" style={{ padding: '2rem' }}>
                  {activeDataTab === 'pessoal' && (
                    <div className="grid-2 fade-in">
                      <div className="form-group">
                        <label className="form-label">Nome Completo</label>
                        <input type="text" name="nome" className="form-input" value={formData.nome || ''} onChange={handlePatientInputChange} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">WhatsApp</label>
                        <input type="text" name="whatsapp" className="form-input" value={formData.whatsapp || ''} onChange={handlePatientInputChange} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" name="email" className="form-input" value={formData.email || ''} onChange={handlePatientInputChange} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Data de Nascimento</label>
                        <input type="date" name="data_nascimento" className="form-input" value={formData.data_nascimento || ''} onChange={handlePatientInputChange} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Sexo</label>
                        <select name="sexo" className="form-input" value={formData.sexo || ''} onChange={handlePatientInputChange}>
                          <option value="Feminino">Feminino</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeDataTab === 'clinico' && (
                    <div className="fade-in">
                      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                        <div className="form-group">
                          <label className="form-label">Peso Inicial (kg)</label>
                          <input type="number" name="peso_inicial" className="form-input" value={formData.peso_inicial || ''} onChange={handlePatientInputChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Altura (cm)</label>
                          <input type="number" name="altura" className="form-input" value={formData.altura || ''} onChange={handlePatientInputChange} />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Objetivos</label>
                        <div className="options-grid">
                          {objetivoOptions.map(opt => (
                            <button key={opt} type="button" className={`option-btn ${formData.objetivos?.includes(opt) ? 'active' : ''}`} onClick={() => handleMultiSelect('objetivos', opt)}>{opt}</button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Patologias/Condições</label>
                        <div className="options-grid">
                          {patologiaOptions.map(opt => (
                            <button key={opt} type="button" className={`option-btn ${formData.patologias?.includes(opt) ? 'active' : ''}`} onClick={() => handleMultiSelect('patologias', opt)}>{opt}</button>
                          ))}
                        </div>
                      </div>

                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Restrições Alimentares</label>
                          <div className="options-grid">
                            {restricaoOptions.map(opt => (
                              <button key={opt} type="button" className={`option-btn ${formData.restricoes_alimentares?.includes(opt) ? 'active' : ''}`} onClick={() => handleMultiSelect('restricoes_alimentares', opt)}>{opt}</button>
                            ))}
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Alergias</label>
                          <div className="options-grid">
                            {alergiaOptions.map(opt => (
                              <button key={opt} type="button" className={`option-btn ${formData.alergias?.includes(opt) ? 'active' : ''}`} onClick={() => handleMultiSelect('alergias', opt)}>{opt}</button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Medicamentos</label>
                          <textarea name="medicamentos" className="form-input" rows="3" value={formData.medicamentos || ''} onChange={handlePatientInputChange}></textarea>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Suplementos</label>
                          <textarea name="suplementos" className="form-input" rows="3" value={formData.suplementos || ''} onChange={handlePatientInputChange}></textarea>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDataTab === 'habitos' && (
                    <div className="fade-in">
                      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                        <div className="form-group">
                          <label className="form-label">Refeições/dia</label>
                          <input type="number" name="refeicoes_por_dia" className="form-input" value={formData.refeicoes_por_dia || ''} onChange={handlePatientInputChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Acorda às</label>
                          <input type="text" name="horario_acorda" className="form-input" value={formData.horario_acorda || ''} onChange={handlePatientInputChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Dorme às</label>
                          <input type="text" name="horario_dorme" className="form-input" value={formData.horario_dorme || ''} onChange={handlePatientInputChange} />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Litros de Água/dia</label>
                        <input type="number" name="litros_agua" className="form-input" value={formData.litros_agua || ''} onChange={handlePatientInputChange} step="0.1" />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Atividade Física</label>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="radio" checked={formData.atividade_fisica === true} onChange={() => setFormData(p => ({...p, atividade_fisica: true}))} /> Sim
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="radio" checked={formData.atividade_fisica === false} onChange={() => setFormData(p => ({...p, atividade_fisica: false}))} /> Não
                          </label>
                        </div>
                        {formData.atividade_fisica && (
                          <input type="text" name="atividade_fisica_descricao" className="form-input" style={{ marginTop: '1rem' }} placeholder="Descreva a atividade..." value={formData.atividade_fisica_descricao || ''} onChange={handlePatientInputChange} />
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Observações Gerais</label>
                        <textarea name="observacoes" className="form-input" rows="4" value={formData.observacoes || ''} onChange={handlePatientInputChange}></textarea>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2: CONSULTAS */}
          {activeMainTab === 'consultas' && (
            <section className="fade-in">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="section-title"><Activity size={22} /> Consultas</h2>
                <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowConsultationModal(true)}>
                  <Plus size={18} /> Nova Consulta
                </button>
              </div>

              <div className="stats-grid" style={{ gridTemplateColumns: '1fr', marginTop: '0' }}>
                <div className="stat-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Evolução de Peso</h3>
                  </div>
                  
                  <div style={{ height: '300px', width: '100%' }}>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} domain={['dataMin - 5', 'dataMax + 5']} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            formatter={(val) => [`${val} kg`, 'Peso']}
                          />
                          <Line type="monotone" dataKey="peso" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--gray-600)', backgroundColor: 'var(--gray-50)', borderRadius: '0.75rem', border: '2px dashed var(--gray-200)' }}>
                        <Weight size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>Nenhuma consulta registrada ainda</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--gray-800)' }}>Histórico de Consultas</h3>
                <div className="table-container">
                  {consultations.length > 0 ? (
                    <table className="consult-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Peso</th>
                          <th>Cintura</th>
                          <th>Quadril</th>
                          <th>% Gordura</th>
                          <th>Observações</th>
                          <th>Próximo Retorno</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consultations.map(c => (
                          <tr key={c.id}>
                            <td style={{ fontWeight: '600' }}>{new Date(c.data_consulta).toLocaleDateString('pt-BR')}</td>
                            <td>{c.peso} kg</td>
                            <td>{c.cintura ? `${c.cintura} cm` : '-'}</td>
                            <td>{c.quadril ? `${c.quadril} cm` : '-'}</td>
                            <td>{c.percentual_gordura ? `${c.percentual_gordura}%` : '-'}</td>
                            <td style={{ fontSize: '0.875rem', color: 'var(--gray-600)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.observacoes}>
                              {c.observacoes || '-'}
                            </td>
                            <td style={{ color: 'var(--primary-dark)', fontWeight: '500' }}>
                              {c.proximo_retorno ? new Date(c.proximo_retorno).toLocaleDateString('pt-BR') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state" style={{ padding: '2rem', backgroundColor: 'var(--white)', borderRadius: '1rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      Nenhuma consulta realizada.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* SECTION 3: PLANOS ALIMENTARES */}
          {activeMainTab === 'planos' && (
            <section className="fade-in">
              {!showPlanView ? (
                <>
                  <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="section-title"><Coffee size={22} /> Planos Alimentares</h2>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={handleGeneratePlan}
                    >
                      <Sparkles size={18} /> Gerar Plano Alimentar com IA
                    </button>
                  </div>

                  <div className="plans-list">
                    {mealPlans.length > 0 ? (
                      mealPlans.map(plan => (
                        <div key={plan.id} className="plan-item" onClick={() => {
                          setCurrentPlan(plan.conteudo.plano_semanal);
                          setShowPlanView(true);
                        }}>
                          <div className="plan-info">
                            <FileText size={20} style={{ color: 'var(--primary)' }} />
                            <div>
                              <span className="plan-date">Gerado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}</span>
                              <p className="plan-summary">Clique para ver e editar o plano</p>
                            </div>
                          </div>
                          <ChevronRight size={20} style={{ color: 'var(--gray-200)' }} />
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'var(--white)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                        <Coffee size={40} style={{ color: 'var(--gray-200)', marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--gray-600)' }}>Nenhum plano alimentar gerado ainda</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="plan-generation-container fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <button 
                      className="nav-item" 
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => {
                        setShowPlanView(false);
                        setCurrentPlan(null);
                      }}
                    >
                      <ArrowLeft size={20} /> Voltar
                    </button>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--gray-800)' }}>
                      {generatingPlan ? 'Gerando Plano com IA...' : 'Plano Alimentar Semanal'}
                    </h2>
                    <div style={{ width: '40px' }}></div>
                  </div>

                  {generatingPlan ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                      <RefreshCw className="animate-spin" size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem' }} />
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Criando dieta personalizada...</h3>
                      <p style={{ color: 'var(--gray-600)' }}>Isso pode levar alguns segundos. Analisando objetivos e restrições.</p>
                    </div>
                  ) : currentPlan ? (
                    <>
                      <div className="day-tabs">
                        {currentPlan.map((day, idx) => (
                          <button 
                            key={idx} 
                            className={`day-tab ${activeDayIndex === idx ? 'active' : ''}`}
                            onClick={() => setActiveDayIndex(idx)}
                          >
                            {day.dia}
                          </button>
                        ))}
                      </div>

                      <div className="meals-grid fade-in">
                        {Object.entries(currentPlan[activeDayIndex].refeicoes).map(([mealKey, items]) => (
                          <div key={mealKey} className="meal-card">
                            <div className="meal-header">
                              {mealKey === 'cafe_da_manha' ? <Sunrise size={20} style={{ color: 'var(--primary)' }} /> : 
                               mealKey === 'lanche_manha' ? <Sun size={20} style={{ color: 'var(--primary)' }} /> : 
                               mealKey === 'almoco' ? <Activity size={20} style={{ color: 'var(--primary)' }} /> : 
                               mealKey === 'lanche_tarde' ? <Sunset size={20} style={{ color: 'var(--primary)' }} /> : 
                               <Coffee size={20} style={{ color: 'var(--primary)' }} />}
                              {mealKey.replace(/_/g, ' ')}
                            </div>
                            <div className="meal-items-list">
                              {items.map((item, itemIdx) => (
                                <div key={itemIdx} className="meal-item-edit">
                                  <span style={{ color: 'var(--gray-600)', fontSize: '0.75rem' }}>{itemIdx + 1}</span>
                                  <input 
                                    type="text" 
                                    className="meal-item-input"
                                    value={item}
                                    onChange={(e) => handleMealChange(activeDayIndex, mealKey, itemIdx, e.target.value)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="plan-actions">
                        <button 
                          className="btn" 
                          style={{ width: 'auto', backgroundColor: 'var(--gray-100)' }}
                          onClick={() => {
                            setShowPlanView(false);
                            setCurrentPlan(null);
                          }}
                        >
                          Descartar
                        </button>
                        <button 
                          className="btn btn-primary" 
                          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          onClick={handleSaveMealPlan}
                          disabled={saving}
                        >
                          {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                          Salvar Plano Alimentar
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <AlertCircle size={40} style={{ color: 'var(--error)', marginBottom: '1rem' }} />
                      <p>Ocorreu um erro ao carregar o plano.</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* MODAL: NOVA CONSULTA */}
      {showConsultationModal && (
        <div className="modal-overlay">
          <div className="modal-container fade-in">
            <div className="modal-header">
              <h3>Nova Consulta</h3>
              <button onClick={() => setShowConsultationModal(false)} className="close-btn"><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveConsultation} className="modal-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Data da Consulta</label>
                  <input type="date" required className="form-input" value={newConsultation.data_consulta} onChange={e => setNewConsultation(p => ({...p, data_consulta: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Peso (kg)</label>
                  <input type="number" step="0.1" required className="form-input" value={newConsultation.peso} onChange={e => setNewConsultation(p => ({...p, peso: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cintura (cm)</label>
                  <input type="number" step="0.1" className="form-input" value={newConsultation.cintura} onChange={e => setNewConsultation(p => ({...p, cintura: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Quadril (cm)</label>
                  <input type="number" step="0.1" className="form-input" value={newConsultation.quadril} onChange={e => setNewConsultation(p => ({...p, quadril: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">% Gordura</label>
                  <input type="number" step="0.1" className="form-input" value={newConsultation.percentual_gordura} onChange={e => setNewConsultation(p => ({...p, percentual_gordura: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Próximo Retorno</label>
                  <input type="date" className="form-input" value={newConsultation.proximo_retorno} onChange={e => setNewConsultation(p => ({...p, proximo_retorno: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea className="form-input" rows="4" value={newConsultation.observacoes} onChange={e => setNewConsultation(p => ({...p, observacoes: e.target.value}))}></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" style={{ width: 'auto', backgroundColor: 'var(--gray-100)' }} onClick={() => setShowConsultationModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .main-tabs-nav {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--gray-200);
          padding-bottom: 1px;
        }
        .main-tab-link {
          padding: 1rem 1.5rem;
          font-weight: 600;
          color: var(--gray-600);
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .main-tab-link:hover {
          color: var(--primary);
        }
        .main-tab-link.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }
        .profile-section {
          margin-bottom: 0;
        }
        .section-header {
          margin-bottom: 1.5rem;
        }
        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gray-800);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .card-tabs {
          background: var(--white);
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--border-color);
        }
        .tabs-nav {
          display: flex;
          border-bottom: 1px solid var(--gray-100);
          background-color: var(--gray-50);
        }
        .tab-link {
          padding: 1rem 2rem;
          font-weight: 600;
          color: var(--gray-600);
          background: none;
          border: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }
        .tab-link:hover {
          color: var(--primary);
        }
        .tab-link.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
          background-color: var(--white);
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.5rem;
        }
        .options-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
          margin-bottom: 1rem;
        }
        .option-btn {
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          border: 1px solid var(--border-color);
          background: var(--white);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .option-btn.active {
          background: var(--primary);
          color: var(--white);
          border-color: var(--primary);
        }
        .table-container {
          background: var(--white);
          border-radius: 1rem;
          overflow-x: auto;
          border: 1px solid var(--border-color);
        }
        .consult-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .consult-table th {
          padding: 1rem;
          background-color: var(--gray-50);
          font-size: 0.875rem;
          color: var(--gray-600);
          font-weight: 600;
          border-bottom: 1px solid var(--gray-200);
        }
        .consult-table td {
          padding: 1.25rem 1rem;
          border-bottom: 1px solid var(--gray-100);
          color: var(--gray-800);
        }
        .plans-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .plan-item {
          background: var(--white);
          padding: 1.25rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s;
        }
        .plan-item:hover {
          border-color: var(--primary);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .plan-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .plan-date {
          display: block;
          font-weight: 700;
          color: var(--gray-800);
        }
        .plan-summary {
          font-size: 0.875rem;
          color: var(--gray-600);
        }
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-container {
          background: var(--white);
          width: 100%;
          max-width: 700px;
          border-radius: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }
        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--gray-100);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--gray-600);
        }
        .modal-body {
          padding: 2rem;
          max-height: 80vh;
          overflow-y: auto;
        }
        .modal-footer {
          padding: 1.5rem 2rem;
          background-color: var(--gray-50);
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .grid-2, .grid-3 {
            grid-template-columns: 1fr;
          }
          .main-tabs-nav {
            overflow-x: auto;
            padding-bottom: 0.5rem;
            gap: 0.5rem;
          }
          .main-tab-link {
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
          }
          .tab-link {
            padding: 1rem 1.25rem;
            font-size: 0.875rem;
          }
          .modal-container {
            max-width: 100%;
            border-radius: 1rem;
          }
          .modal-body {
            padding: 1.5rem;
          }
          .section-title {
            font-size: 1.25rem;
          }
        }
        @media (max-width: 480px) {
          .main-content {
            padding: 1rem;
            padding-top: 5.5rem;
          }
          .nav-item {
            font-size: 0.875rem;
          }
          .consult-table th, .consult-table td {
            padding: 0.75rem 0.5rem;
            font-size: 0.75rem;
          }
        }
      `}} />
    </div>
  );
};

export default PatientProfile;
