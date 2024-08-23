<script lang="ts">
	import DashboardTable from '$components/DashboardTable.svelte';
	import LogsTable from '$components/LogsTable.svelte';
	import ViewNavigation from '$components/ViewNavigation.svelte';
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { Game, Log } from '$types';
	import type { ViewStateStore } from '../stores/view-state-store.svelte';

	let { store }: { store: ViewStateStore } = $props();
    const FAKE_LOGS: Log[] = [
        {
            id: '1',
            game_id: '2033',
            action: 'create',
            created_at: '2024-08-22T10:00:00Z',
            user_name: 'Silja',
        },
        {
            id: '2',
            game_id: '2034',
            action: 'update',
            created_at: '2024-08-22T11:00:00Z',
            user_name: 'Frieder',
        },
        {
            id: '3',
            game_id: '2034',
            action: 'delete',
            created_at: '2024-08-22T12:00:00Z',
            user_name: 'Paco'
        },
        {
            id: '4',
            game_id: '2035',
            action: 'create',
            created_at: '2024-08-22T13:00:00Z',
            user_name: 'Emma',
        },
        {
            id: '5',
            game_id: '2035',
            action: 'update',
            created_at: '2024-08-22T14:00:00Z',
            user_name: 'Liam',
        },
        {
            id: '6',
            game_id: '2036',
            action: 'delete',
            created_at: '2024-08-22T15:00:00Z',
            user_name: 'Olivia',
        },
        {
            id: '7',
            game_id: '2036',
            action: 'create',
            created_at: '2024-08-22T16:00:00Z',
            user_name: 'Noah',
        },
        {
            id: '8',
            game_id: '2037',
            action: 'update',
            created_at: '2024-08-22T17:00:00Z',
            user_name: 'Ava',
        },
        {
            id: '9',
            game_id: '2037',
            action: 'delete',
            created_at: '2024-08-22T18:00:00Z',
            user_name: 'William',
        },
        {
            id: '10',
            game_id: '2038',
            action: 'create',
            created_at: '2024-08-22T19:00:00Z',
            user_name: 'Sophia',
        },
        {
            id: '11',
            game_id: '2038',
            action: 'update',
            created_at: '2024-08-22T20:00:00Z',
            user_name: 'Isabella',
        },
        {
            id: '12',
            game_id: '2039',
            action: 'delete',
            created_at: '2024-08-22T21:00:00Z',
            user_name: 'Mia',
        },
        {
            id: '13',
            game_id: '2039',
            action: 'create',
            created_at: '2024-08-22T22:00:00Z',
            user_name: 'James',
        }
    ]

	const handleBackToDashboard = () => {
		store.updateSelectedGameId('');
		store.updateView('dashboard');
	};
</script>

<ViewWrapper>
	<ViewNavigation
		viewName="Activity Logs"
		mainAction={handleBackToDashboard}
		mainActionText="Zurück"
	/>

	<LogsTable logs={FAKE_LOGS} />
</ViewWrapper>
