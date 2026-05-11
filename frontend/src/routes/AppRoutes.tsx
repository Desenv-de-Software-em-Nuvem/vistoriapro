import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'

// Importação direta para páginas críticas
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'

// Lazy loading para páginas menos acessadas
const PropertyCategoryPage = lazy(() => import('../pages/PropertyCategoryPage').then(module => ({ default: module.PropertyCategoryPage })))
const PropertyRegistrationPage = lazy(() => import('../pages/PropertyRegistrationPage').then(module => ({ default: module.PropertyRegistrationPage })))
const PropertyListPage = lazy(() => import('../pages/PropertyListPage').then(module => ({ default: module.PropertyListPage })))
const InspectionPage = lazy(() => import('../pages/InspectionPage').then(module => ({ default: module.InspectionPage })))
const PropertyLaudoPage = lazy(() => import('../pages/PropertyLaudoPage').then(module => ({ default: module.PropertyLaudoPage })))
const AdminUsersPage = lazy(() => import('../pages/AdminUsersPage'))

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  const renderProtected = (element: React.ReactNode) => (
    isAuthenticated ? (
      <Suspense fallback={<LoadingSpinner />}>
        {element}
      </Suspense>
    ) : <Navigate to="/login" replace />
  )

  const renderInspectionProtected = (element: React.ReactNode) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (user?.permitidoVistoria === false) return <Navigate to="/dashboard" replace />

    return (
      <Suspense fallback={<LoadingSpinner />}>
        {element}
      </Suspense>
    )
  }

  const renderAdminProtected = (element: React.ReactNode) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (user?.papel !== 'admin') return <Navigate to="/dashboard" replace />

    return (
      <Suspense fallback={<LoadingSpinner />}>
        {element}
      </Suspense>
    )
  }

  return (
    <>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />} 
        />
      <Route 
        path="/property-registration" 
        element={renderProtected(<PropertyRegistrationPage />)}
      />
      <Route 
        path="/property-list" 
        element={renderProtected(<PropertyListPage />)}
      />
      <Route 
        path="/property-category/:inspectionId" 
        element={renderInspectionProtected(<PropertyCategoryPage />)}
      />
      <Route 
        path="/inspection/:id?" 
        element={renderInspectionProtected(<InspectionPage />)}
      />

      <Route 
        path="/property-edit/:id" 
        element={renderProtected(<PropertyRegistrationPage />)}
      />
      <Route 
        path="/property-laudo/:id" 
        element={renderProtected(<PropertyLaudoPage />)}
      />
      <Route 
        path="/admin/users" 
        element={renderAdminProtected(<AdminUsersPage />)}
      />
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
      />
      {/* Não redirecionar rotas não encontradas automaticamente */}
      <Route 
        path="*" 
        element={
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            textAlign: 'center'
          }}>
            <h2>Página não encontrada</h2>
            <p>A página que você está procurando não existe.</p>
            <button 
              onClick={() => window.location.href = isAuthenticated ? "/dashboard" : "/login"}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              {isAuthenticated ? 'Voltar ao Dashboard' : 'Fazer Login'}
            </button>
          </div>
        } 
      />
    </Routes>
    </>
  )
}
