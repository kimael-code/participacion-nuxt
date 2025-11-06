export default defineAppConfig({
  icon: {
    size: '', // default <Icon> size applied
    class: '', // default <Icon> class applied
  },
  appSettings: {
    sidebar: {
      collapsible: 'offcanvas', // 'offcanvas' | 'icon' | 'none'
      side: 'left', // 'left' | 'right'
      variant: 'inset', // 'sidebar' | 'floating' | 'inset'
    },
    theme: {
      color: 'green', // 'default' | 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal' | 'yellow' | 'rose'
      //   type: 'scaled', // 'default' | 'mono' | 'scaled'
    },
  },
});
