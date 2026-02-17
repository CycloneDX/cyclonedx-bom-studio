import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/components/editors/DashboardView.vue'),
    meta: { label: 'nav.dashboard' }
  },
  {
    path: '/bom-identity',
    name: 'BomIdentity',
    component: () => import('@/components/editors/BomIdentityEditor.vue'),
    meta: { label: 'nav.bomIdentity' }
  },
  {
    path: '/metadata',
    name: 'Metadata',
    component: () => import('@/components/editors/MetadataEditor.vue'),
    meta: { label: 'nav.metadata' }
  },
  {
    path: '/components',
    name: 'Components',
    component: () => import('@/components/editors/ComponentListEditor.vue'),
    meta: { label: 'nav.components' }
  },
  {
    path: '/services',
    name: 'Services',
    component: () => import('@/components/editors/ServiceListEditor.vue'),
    meta: { label: 'nav.services' }
  },
  {
    path: '/dependencies',
    name: 'Dependencies',
    component: () => import('@/components/editors/DependencyEditor.vue'),
    meta: { label: 'nav.dependencies' }
  },
  {
    path: '/external-references',
    name: 'ExternalReferences',
    component: () => import('@/components/editors/BomExternalReferencesEditor.vue'),
    meta: { label: 'nav.externalReferences' }
  },
  {
    path: '/compositions',
    name: 'Compositions',
    component: () => import('@/components/editors/CompositionEditor.vue'),
    meta: { label: 'nav.compositions' }
  },
  {
    path: '/annotations',
    name: 'Annotations',
    component: () => import('@/components/editors/AnnotationEditor.vue'),
    meta: { label: 'nav.annotations' }
  },
  {
    path: '/citations',
    name: 'Citations',
    component: () => import('@/components/editors/CitationEditor.vue'),
    meta: { label: 'nav.citations' }
  },
  {
    path: '/properties',
    name: 'Properties',
    component: () => import('@/components/editors/BomPropertiesEditor.vue'),
    meta: { label: 'nav.properties' }
  },
  {
    path: '/json-source',
    name: 'JsonSource',
    component: () => import('@/components/editors/JsonSourceEditor.vue'),
    meta: { label: 'nav.jsonSource' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
