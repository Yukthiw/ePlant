import { ThemeProvider } from '@mui/material/styles'
import {
  Box,
  Container,
  CssBaseline,
  Drawer,
  DrawerProps,
  Icon,
  IconButton,
} from '@mui/material'
import * as React from 'react'
import arabidopsis from './Species/arabidopsis'
import { dark, light } from './theme'
import { LeftNav } from './UI/LeftNav'
import { ExpandMore } from '@mui/icons-material'
import { Provider } from 'jotai'
import * as FlexLayout from 'flexlayout-react'
import TabsetPlaceholder from './UI/Layout/TabsetPlaceholder'
import {
  useGeneticElements,
  useViews,
  viewsAtom,
  useFreeViews,
  useSetViews,
} from './state'
import { ViewContainer } from './views/ViewContainer'
import { Actions, Layout } from 'flexlayout-react'
import GeneticElement from './GeneticElement'
import { NoViewError } from './views/View'

// TODO: Make this drawer support opening/closing on mobile

const sideBarWidth = 300

function ResponsiveDrawer(props: DrawerProps) {
  const [open, setOpen] = React.useState(props.open)

  return (
    <Drawer {...props} open={open} onClose={() => setOpen(false)}>
      {props.children}
    </Drawer>
  )
}

export type EplantProps = {}

/**
 * Rendered in each tab. Contains a view container.
 * @param props The id of this tab
 * @returns The rendered tab
 */
function ViewTab(props: { id: string }) {
  const [views, setViews] = useViews()
  const freeViews = useFreeViews()
  const genes = useGeneticElements()[0]
  const view = views[props.id]
  const gene = genes.find((g) => g.id == view.activeGene) ?? null
  if (!view) {
    // TODO: Better fallback
    return <div>Uh oh</div>
  }
  const v = (gene ? gene.views.concat(freeViews) : freeViews).find(
    (v) => v.id == view.view
  )
  console.log(gene)

  if (!v) throw new NoViewError(`No ${view.view} found for ${view.activeGene}`)

  return (
    <ViewContainer
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'scroll',
      }}
      view={v}
      gene={gene ?? null}
      setView={(newView) => {
        setViews((views) => ({
          ...views,
          [props.id]: {
            ...views[props.id],
            view: newView.id,
          },
        }))
      }}
    />
  )
}

/**
 * The flexlayout factory is a function that takes a layout node and returns the React component that should be rendered there.
 * @param node The node to render
 * @returns The React component to render
 */
const factory: (node: FlexLayout.TabNode) => JSX.Element | undefined = (
  node
) => {
  const id = node.getId() as string
  const name = node.getName()
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        border: '1px solid #555',
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box',
        alignItems: 'center',
      }}
    >
      <ViewTab id={id} />
    </div>
  )
}

// For some reason this is necessary to make the tabs work, maybe FlexLayout uses a Jotai provider?
const eplantScope = Symbol('Eplant scope')

/**
 * The main Eplant component. This is the root of the application. It contains the left nav and the layout.
 * @returns {JSX.Element} The rendered Eplant component
 */
export default function Eplant() {
  const layout = React.useRef<Layout>(null)
  const [activeId, setActiveId] = React.useState<string>('')
  const [model, setModel] = React.useState(
    FlexLayout.Model.fromJson({
      global: {},
      borders: [],
      layout: {
        type: 'row',
        weight: 100,
        children: [],
      },
    })
  )

  const [views, setViews] = useViews()

  //TODO: Create a way for the user to add tabs and remove this line
  // @ts-ignore
  window.addTab = addTab
  //TODO: Break into more components to prevent unnecessary rerendering
  return (
    <Provider scope={eplantScope}>
      <ThemeProvider theme={dark}>
        <CssBaseline />
        <ResponsiveDrawer variant="persistent" open={true}>
          <Container
            disableGutters
            sx={{
              padding: '20px',
              width: `${sideBarWidth}px`,
              boxSizing: 'border-box',
            }}
          >
            <LeftNav
              onSelectGene={(gene: GeneticElement) =>
                setViews((views) => ({
                  ...views,
                  [activeId]: {
                    ...views[activeId],
                    activeGene: gene.id,
                  },
                }))
              }
              selectedGene={views[activeId ?? '']?.activeGene ?? undefined}
            />
          </Container>
        </ResponsiveDrawer>
        <Box
          sx={(theme) => ({
            height: '100%',
            left: `${sideBarWidth}px`,
            right: '0px',
            position: 'absolute',
          })}
        >
          <Box
            sx={{
              background: '#fff',
              width: '100%',
              height: '100%',
            }}
          ></Box>
          <FlexLayout.Layout
            ref={layout}
            model={model}
            factory={factory}
            onTabSetPlaceHolder={() => (
              <TabsetPlaceholder addTab={() => addTab()} />
            )}
            onModelChange={(newModel) => {
              const newId = newModel
                .getActiveTabset()
                ?.getSelectedNode?.()
                ?.getId?.()
              if (!newId) throw new Error('No active tabset')
              setActiveId(newId)
            }}
          ></FlexLayout.Layout>
        </Box>
      </ThemeProvider>
    </Provider>
  )
  function addTab() {
    if (!layout.current) return
    const id = Math.random().toString(16).split('.')[1]
    setViews((views) => {
      const a = {
        ...views,
        [id]: {
          activeGene: null,
          view: 'get-started',
        },
      }
      return a
    })
    layout.current.addTabToActiveTabSet({
      name: 'Get Started',
      component: 'view',
      id,
      type: 'tab',
    })
  }
}
