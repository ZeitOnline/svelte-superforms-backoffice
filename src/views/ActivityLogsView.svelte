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
            detail: 'Game with id 2033 was created'
        },
        {
            id: '2',
            game_id: '2034',
            action: 'update',
            created_at: '2024-08-22T11:00:00Z',
            user_name: 'Frieder',
            detail: 'Question with id 1234 was updated'
        },
        {
            id: '3',
            game_id: '2034',
            action: 'delete',
            created_at: '2024-08-22T12:00:00Z',
            user_name: 'Paco',
            detail: 'Game with id 2034 was deleted'
        },
        {
            id: '4',
            game_id: '2035',
            action: 'create',
            created_at: '2024-08-22T13:00:00Z',
            user_name: 'Emma',
            detail: 'Game with id 2035 was created'
        },
        {
            id: '5',
            game_id: '2035',
            action: 'update',
            created_at: '2024-08-22T14:00:00Z',
            user_name: 'Liam',
            detail: 'Question with id 3 was updated'
        },
        {
            id: '6',
            game_id: '2036',
            action: 'delete',
            created_at: '2024-08-22T15:00:00Z',
            user_name: 'Olivia',
            detail: 'Game with id 2036 was deleted'
        },
        {
            id: '7',
            game_id: '2036',
            action: 'create',
            created_at: '2024-08-22T16:00:00Z',
            user_name: 'Noah',
            detail: 'Game with id 2036 was created'
        },
        {
            id: '8',
            game_id: '2037',
            action: 'update',
            created_at: '2024-08-22T17:00:00Z',
            user_name: 'Ava',
            detail: 'Question with id 1234 was updated'
        },
        {
            id: '9',
            game_id: '2037',
            action: 'delete',
            created_at: '2024-08-22T18:00:00Z',
            user_name: 'William',
            detail: 'Game with id 2037 was deleted'
        },
        {
            id: '10',
            game_id: '2038',
            action: 'create',
            created_at: '2024-08-22T19:00:00Z',
            user_name: 'Sophia',
            detail: 'Game with id 2038 was created'
        },
        {
            id: '11',
            game_id: '2038',
            action: 'update',
            created_at: '2024-08-22T20:00:00Z',
            user_name: 'Isabella',
            detail: 'Question with id 1234 was updated'
        },
        {
            id: '12',
            game_id: '2039',
            action: 'delete',
            created_at: '2024-08-22T21:00:00Z',
            user_name: 'Mia',
            detail: 'Game with id 2039 was deleted'
        },
        {
            id: '13',
            game_id: '2039',
            action: 'create',
            created_at: '2024-08-22T22:00:00Z',
            user_name: 'James',
            detail: 'Game with id 2039 was created'
        }
    ]

	const handleBackToDashboard = () => {
		store.updateSelectedGameId(-1);
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
