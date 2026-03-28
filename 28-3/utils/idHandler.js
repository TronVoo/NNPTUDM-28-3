module.exports = {
    GenID: function (data) {
        let ids = data.map(
            function (e) {
                return Number.parseInt(e.id)
            }
        )
        return Math.max(...ids) + 1;
    },
    getItemByID(id, data) {
        let result = data.filter(e => {
            return e.id == id && !e.isDeleted
        })
        if (result.length > 0) {
            return result[0];
        }
        return false
    }
}