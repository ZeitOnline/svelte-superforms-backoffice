<script lang="ts">
    let { viewName, mainAction, mainActionText } = $props<{ viewName: string; mainAction: () => void, 
    mainActionText: string }>();
</script>

<nav class="flex justify-between w-full items-center mb-z-ds-12">
    <div class="flex flex-col">
        <span class="font-bold">Eckchen</span>
        <span class="text-z-ds-general-black-80 text-xs">{viewName}</span>
    </div>

    <button class="z-ds-button" onclick={mainAction}>{mainActionText}</button>
</nav>